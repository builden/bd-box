#!/bin/bash

# Pre-commit Hook
# 在 commit 前运行检查

echo "=== Pre-commit Checks ==="
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "✓ 有待提交的更改"
    git status --short
else
    echo "✗ 没有待提交的更改"
    exit 0
fi

echo ""
echo "建议在 commit 前:"
echo "  1. 运行测试: bun test"
echo "  2. 运行 lint: bun run lint"
echo "  3. 使用 /code-review 进行代码审查"
echo ""
echo "继续 commit? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "请继续..."
else
    echo "已取消 commit"
    exit 1
fi
