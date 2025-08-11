# 🧠 CLAUDE CODE GLOBAL MEMORY SYSTEM

## MANDATORY: USE MEMORY FOR ALL INTERACTIONS

This system provides **global persistent memory** across all Claude Code sessions and projects. The memory is stored in a centralized location (`~/.claude-memory`) and accessible from any directory.

## 🚨 CRITICAL WORKFLOW

### STEP 1: Check Memory BEFORE Starting Any Task
```bash
claude-memory context "<user request description>"
```

### STEP 2: Complete Your Task

### STEP 3: Log Your Solution
```bash
claude-memory log "<user request>" "<what you accomplished>" [files changed...]
```

## ⚡ Global Memory Commands (Use These!)

**From ANY directory on your system:**

```bash
# Get memory context for a request
claude-memory context "fix authentication bug"

# Log a solution to memory
claude-memory log "fix auth bug" "updated JWT secret validation" "auth.js config.js"

# Check memory system status
claude-memory status

# Get session summary
claude-memory summary

# Restart Weaviate if needed
claude-memory restart
```

## 📍 Global Memory Location

- **Memory Database**: `~/.claude-memory/` (persistent across all projects)
- **Vector Database**: Weaviate on `localhost:8080` (shared globally)
- **All Projects**: Access the same memory pool with project-specific context

## 📖 Example Workflow

**User Request**: "Fix the EQ not working in production builds"

**Your Response**:
1. First, check global memory:
   ```bash
   claude-memory context "Fix EQ production build issue"
   ```

2. Memory returns (from ANY previous project):
   ```
   🎯 Found similar solution:
   - Previous fix: "Disabled standalone binary in spawn.js"  
   - Project: "auto-master"
   - File: "src/ipc/spawn.js"
   - Issue: "PyInstaller bundle not processing EQ parameters"
   ```

3. Apply the known solution or build upon it

4. Log your work globally:
   ```bash
   claude-memory log "Fix EQ production build" "Applied spawn.js fix - disabled getStandaloneBinary()" "src/ipc/spawn.js"
   ```

## 🌐 Cross-Project Memory Benefits

- **Solutions transfer between projects**: Fix in Project A helps with Project B
- **Pattern recognition**: Similar architectures, similar solutions
- **Accumulated expertise**: Memory gets smarter across all your work
- **Context sharing**: Understanding carries between different codebases

## 🎯 Memory Contains (Global)

- **All Project Contexts**: Every project you've worked on
- **Universal Solutions**: Debugging fixes that work across projects
- **Code Patterns**: Reusable implementations and designs
- **Error Database**: How specific bugs were resolved everywhere
- **Best Practices**: Patterns that work well across codebases

## 🔧 Setup (One-Time Only)

If not already installed:

```bash
# Install global memory system
curl -O https://github.com/your-repo/claude-memory/install_global_memory.sh
chmod +x install_global_memory.sh
./install_global_memory.sh

# Or manual setup
mkdir -p ~/.claude-memory
# Copy memory files to ~/.claude-memory
# Run setup script
```

## 🧠 Why Global Memory Matters

**WITHOUT GLOBAL MEMORY**: 
- ❌ Repeat same debugging across different projects
- ❌ Lose solutions when switching projects
- ❌ No cross-project learning
- ❌ Start from scratch in each codebase

**WITH GLOBAL MEMORY**:
- ✅ Solutions work across all projects
- ✅ Patterns transfer between codebases
- ✅ Accumulated expertise grows exponentially
- ✅ Context from all your work is always available

## 🚨 IMPORTANT RULES

1. **ALWAYS** use `claude-memory context` before coding
2. **ALWAYS** use `claude-memory log` after completing tasks
3. **NEVER** ignore memory context - it contains real solutions from all your projects
4. **ALWAYS** include project context in logs for better future retrieval
5. **BUILD ON** previous solutions rather than starting over

## 🔍 Advanced Global Commands

```bash
# Search across all your projects
claude-memory context "React authentication patterns"

# Find debugging solutions from anywhere
claude-memory context "production build issues"

# Get project-specific context
claude-memory context "this project database setup"

# Check memory statistics
claude-memory status
```

## 🔧 Troubleshooting

**Memory command not found?**
```bash
# Add to PATH manually
export PATH="$HOME/.claude-memory:$PATH"

# Or restart terminal after installation
```

**Memory not working?**
```bash
# Check system status
claude-memory status

# Restart database if needed
claude-memory restart

# Check if Weaviate is running
curl http://localhost:8080/v1/.well-known/ready
```

**No context found?**
- Memory builds over time across all projects
- Try broader search terms
- Keep using it - it gets better with more data

## 📊 Memory Statistics

Use `claude-memory status` to see:
- Total memories stored globally
- Current project context
- Database connection status
- Memory system health

---

## 🎯 SUCCESS METRIC

**You're using global memory correctly when**:
- Solutions from Project A help with Project B
- You reference patterns from previous work
- Development speed increases across ALL projects
- Context carries between different codebases seamlessly

**🧠 Global memory makes you exponentially more effective across your entire development workflow!**

## 🚀 Installation Status

**Memory Location**: `~/.claude-memory/`  
**Global Command**: `claude-memory` (available from any directory)  
**Database**: Weaviate on `localhost:8080`  
**Status**: Use `claude-memory status` to verify