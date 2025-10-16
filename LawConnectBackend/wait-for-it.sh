#!/bin/sh
# wait-for-it.sh: wait for a TCP service to be ready (POSIX sh version)

HOST=""
PORT=""
TIMEOUT=15
QUIET=0
CMD=""

echoerr() {
  if [ "$QUIET" -eq 0 ]; then
    echo "$@" 1>&2
  fi
}

usage() {
  echo "Usage: $0 host:port [-t timeout] [-- command args]" 1>&2
  exit 1
}

wait_for() {
  START=$(date +%s)
  while :; do
    (echo > /dev/tcp/$HOST/$PORT) >/dev/null 2>&1
    RESULT=$?
    if [ $RESULT -eq 0 ]; then
      END=$(date +%s)
      echoerr "$HOST:$PORT is available after $((END - START)) seconds"
      break
    fi

    NOW=$(date +%s)
    ELAPSED=$((NOW - START))
    if [ "$TIMEOUT" -gt 0 ] && [ "$ELAPSED" -ge "$TIMEOUT" ]; then
      echoerr "Timeout after $TIMEOUT seconds waiting for $HOST:$PORT"
      return 124
    fi
    sleep 1
  done
  return 0
}

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    *:* )
      HOST="${1%:*}"
      PORT="${1#*:}"
      shift
      ;;
    -q|--quiet)
      QUIET=1
      shift
      ;;
    -t)
      TIMEOUT="$2"
      shift 2
      ;;
    --)
      shift
      CMD="$@"
      break
      ;;
    --help)
      usage
      ;;
    *)
      echoerr "Unknown argument: $1"
      usage
      ;;
  esac
done

if [ -z "$HOST" ] || [ -z "$PORT" ]; then
  echoerr "Error: host and port must be provided"
  usage
fi

wait_for
RESULT=$?

if [ -n "$CMD" ]; then
  if [ $RESULT -ne 0 ]; then
    exit $RESULT
  fi
  exec $CMD
else
  exit $RESULT
fi

