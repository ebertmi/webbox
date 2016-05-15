# SSH Agent Forwarding on Windows
1. run `ssh-agent` which outputs something like this:
```bash
SSH_AUTH_SOCK=/tmp/ssh-fJN4Ut53h98O/agent.17232; export SSH_AUTH_SOCK;
SSH_AGENT_PID=2472; export SSH_AGENT_PID;
echo Agent pid 2472;
```

2. As this may fail on windows 10 or cmd you need to set the env variables by yourself:
```bash
set SSH_AUTH_SOCK=/tmp/ssh-fJN4Ut53h98O/agent.17232
set SSH_AGENT_PID=2472
```

3. Then add your identity to the agent with
```
cd C:\\Users\NAME\.ssh
ssh-add id_rsa (or other key)
ssh-add -l
```
Use the `ssh-add -l` to check the identities that you have added to the agent.