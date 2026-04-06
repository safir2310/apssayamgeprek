#!/bin/bash
while true; do
  echo "Starting dev server at $(date)" >> /home/z/my-project/dev.log
  cd /home/z/my-project && bun run dev >> /home/z/my-project/dev.log 2>&1
  echo "Dev server stopped at $(date)" >> /home/z/my-project/dev.log
  sleep 5
done
