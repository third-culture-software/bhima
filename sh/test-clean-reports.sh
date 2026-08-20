#!/bin/bash

if [[ -d results ]]; then
	rm -rf ./results || true
	rm -rf ./test-results || true
fi
