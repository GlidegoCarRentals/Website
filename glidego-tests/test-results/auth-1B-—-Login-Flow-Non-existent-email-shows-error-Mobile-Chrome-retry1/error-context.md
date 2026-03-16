# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - button "Sign In" [ref=e5] [cursor=pointer]
      - button "Create Account" [ref=e6] [cursor=pointer]
    - generic [ref=e7]: Welcome back
    - generic [ref=e8]: Sign in to access your account
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Email Address
        - textbox "you@example.com" [ref=e12]: nobody_xyz_123@fake.com
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Password
          - link "Forgot password?" [ref=e16] [cursor=pointer]:
            - /url: /reset-password
        - generic [ref=e17]:
          - textbox "••••••••" [active] [ref=e18]: GlideGo@1234
          - button "👁️" [ref=e19] [cursor=pointer]
    - generic [ref=e20]:
      - generic [ref=e22] [cursor=pointer]: ✓
      - generic [ref=e23] [cursor=pointer]: Remember me for 30 days
    - button "Sign In →" [ref=e24] [cursor=pointer]
    - generic [ref=e27]: OR
    - button "Continue with Google" [ref=e29] [cursor=pointer]:
      - img [ref=e30]
      - text: Continue with Google
    - paragraph [ref=e35]:
      - text: Don't have an account?
      - button "Create one" [ref=e36] [cursor=pointer]
  - alert [ref=e37]
```