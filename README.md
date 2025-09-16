# Insureply

Built for a fast-scaling insurance company with **500+ clients**, the all-in-one dashboard allows each client to securely access and manage all financial information, but specifically made for insurance policies.

<img width="1280" height="720" alt="image" src="https://github.com/user-attachments/assets/a9b2aa72-5e87-4d54-8368-a36977c57bde" />


## Features

- Secure client authentication and role-based access for policy holders, agents, and admins  
- Intuitive dashboard for viewing, submitting, and managing insurance policies  
- Real-time updates and notifications (e.g. policy status, renewals, etc.)  
- Collapsible layouts and UI/UX designed for clarity and responsiveness  
- Backend services that ensure data consistency, with automated policy tracking and advisor overhead reduction  


## Architecture Overview

1. Client requests are handled via role-aware routes (user, agent, admin).  
2. Policies are stored and managed in Supabase; versioning / status handled via backend functions.  
3. UI sends/receives API calls, reflecting real-time changes (renewals, new policy submission, etc.).  
4. Automated tracking of policy lifecycle reduces manual overhead and improves data consistency.  


## Impact

- Improved data consistency, lowering advisor overhead by ~30%  
- Reduced response times for policy inquiries by ~40%  
- Scaled support to 500+ clients with a unified dashboard experience  
