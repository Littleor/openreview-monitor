from collections import defaultdict, deque
import time
from threading import Lock
from typing import Deque, Dict, Tuple


class RateLimiter:
    """In-memory rate limiter for simple authentication throttling."""

    def __init__(self, max_attempts: int, window_seconds: int):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.enabled = max_attempts > 0 and window_seconds > 0
        self._attempts: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _prune(self, entries: Deque[float], now: float) -> None:
        cutoff = now - self.window_seconds
        while entries and entries[0] <= cutoff:
            entries.popleft()

    def is_blocked(self, key: str) -> Tuple[bool, int]:
        if not self.enabled:
            return False, 0
        now = time.monotonic()
        with self._lock:
            entries = self._attempts[key]
            self._prune(entries, now)
            if len(entries) >= self.max_attempts:
                retry_after = int(self.window_seconds - (now - entries[0]))
                if retry_after < 1:
                    retry_after = 1
                return True, retry_after
            return False, 0

    def add_attempt(self, key: str) -> None:
        if not self.enabled:
            return
        now = time.monotonic()
        with self._lock:
            entries = self._attempts[key]
            self._prune(entries, now)
            entries.append(now)

    def reset(self, key: str) -> None:
        if not self.enabled:
            return
        with self._lock:
            self._attempts.pop(key, None)
