#!/usr/bin/env python3
"""Deploy all static projects to Surge.sh using pexpect"""
import pexpect
import sys
import subprocess
import time

EMAIL = "arjunvashishtha2004@gmail.com"
PASSWORD = "Arjun@2026Portfolio"

PROJECTS = [
    ("/home/z/my-project/build/weather-app", "arjun-weather.surge.sh"),
    ("/home/z/my-project/build/todo-drag-drop", "arjun-todo.surge.sh"),
    ("/home/z/my-project/build/movie-explorer", "arjun-movies.surge.sh"),
    ("/home/z/my-project/build/pomodoro-timer", "arjun-pomodoro.surge.sh"),
    ("/home/z/my-project/build/github-user-search", "arjun-gh-search.surge.sh"),
]

def deploy(folder, domain):
    print(f"\n{'='*50}")
    print(f"Deploying {folder} -> {domain}")
    print(f"{'='*50}")
    cmd = f"surge {folder} {domain}"
    child = pexpect.spawn(cmd, timeout=120, encoding="utf-8")
    try:
        while True:
            try:
                idx = child.expect([r"email:", r"password:", pexpect.EOF], timeout=30)
                if idx == 0:
                    child.sendline(EMAIL)
                elif idx == 1:
                    child.sendline(PASSWORD)
                elif idx == 2:
                    break
            except pexpect.exceptions.TIMEOUT:
                child.sendline("")
    except Exception as e:
        print(f"Error: {e}")
        return False
    output = child.before or ""
    if "Success" in output or "Published" in output:
        print(f"✅ {domain} deployed")
        return True
    else:
        print(f"⚠️  Output: {output[-200:]}")
        return False

# First login
print("=== Logging in to Surge ===")
child = pexpect.spawn("surge login", timeout=60, encoding="utf-8")
try:
    while True:
        try:
            idx = child.expect([r"email:", r"password:", pexpect.EOF], timeout=20)
            if idx == 0: child.sendline(EMAIL)
            elif idx == 1: child.sendline(PASSWORD)
            elif idx == 2: break
        except pexpect.exceptions.TIMEOUT:
            child.sendline("")
except: pass
print("Login done")

# Deploy each project
results = []
for folder, domain in PROJECTS:
    ok = deploy(folder, domain)
    results.append((domain, ok))

print(f"\n{'='*50}")
print("SUMMARY")
print(f"{'='*50}")
for domain, ok in results:
    mark = "✅" if ok else "❌"
    print(f"  {mark} https://{domain}")
