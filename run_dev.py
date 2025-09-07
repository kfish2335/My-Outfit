import subprocess
import sys
import os
import platform

def run():
    root = os.path.dirname(os.path.abspath(__file__))

    # Frontend
    frontend_dir = os.path.join(root, "frontend")
    # Backend
    backend_dir = os.path.join(root, "backend")

    # Commands
    frontend_cmd = ["npm", "run", "dev"]
    backend_cmd = ["uvicorn", "app.main:app", "--reload", "--port", "8000"]

    # On Windows, use shell=True to make npm/uvicorn work properly
    use_shell = platform.system() == "Windows"

    # Start frontend
    fe = subprocess.Popen(frontend_cmd, cwd=frontend_dir, shell=use_shell)
    print("✅ Frontend running at http://localhost:3000")

    # Start backend
    be = subprocess.Popen(backend_cmd, cwd=backend_dir, shell=use_shell)
    print("✅ Backend running at http://localhost:8000")

    try:
        fe.wait()
        be.wait()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        fe.terminate()
        be.terminate()

if __name__ == "__main__":
    run()