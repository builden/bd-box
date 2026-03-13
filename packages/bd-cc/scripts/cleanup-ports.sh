#!/bin/bash
# Kill processes on bd-cc development ports

echo "清理占用端口..."

# bd-cc ports: 3001 (server), 5173 (vite dev)
PORTS=(3001 5173)

for PORT in "${PORTS[@]}"; do
  PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "  释放端口 $PORT (PID: $PID)"
    kill -9 $PID 2>/dev/null
  else
    echo "  端口 $PORT 未被占用"
  fi
done

echo "完成！"
