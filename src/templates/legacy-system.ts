import type { Template } from "../vault-types";

export const LEGACY_SYSTEM_TEMPLATE_ID = "legacy-system";

export const legacySystemTemplate: Template = {
  id: LEGACY_SYSTEM_TEMPLATE_ID,
  name: "Legacy system",
  sections: [
    {
      id: "what",
      label: "What is the system",
      fields: [
        { id: "name", label: "System name", type: "text", required: true, placeholder: "e.g. Home NAS" },
        { id: "description", label: "Short description", type: "textarea", placeholder: "What this system does…" },
        { id: "purpose", label: "Purpose", type: "textarea", placeholder: "Why it exists, who uses it…" },
        { id: "tech_stack", label: "Tech stack", type: "textarea", placeholder: "OS, apps, versions…" },
      ],
    },
    {
      id: "access",
      label: "How to access",
      fields: [
        { id: "urls", label: "URLs", type: "textarea", placeholder: "Admin URLs, dashboards…" },
        { id: "ssh", label: "SSH", type: "text", placeholder: "ssh user@host" },
        { id: "rdp", label: "RDP", type: "text", placeholder: "Host or connection details…" },
        { id: "vpn", label: "VPN", type: "textarea", placeholder: "VPN config or how to connect…" },
        { id: "steps", label: "Step-by-step access", type: "textarea", placeholder: "Ordered steps for a successor…" },
      ],
    },
    {
      id: "credentials",
      label: "Passwords and access details",
      fields: [
        { id: "username", label: "Username", type: "text" },
        { id: "password", label: "Password", type: "password" },
        { id: "two_fa", label: "2FA / MFA notes", type: "textarea", placeholder: "App, backup codes location…" },
        { id: "recovery_codes", label: "Recovery codes", type: "textarea", placeholder: "Where stored or hint…" },
      ],
    },
    {
      id: "locations",
      label: "Locations",
      fields: [
        { id: "physical", label: "Physical location", type: "textarea", placeholder: "Server room, cabinet, keys…" },
        { id: "contacts", label: "Contacts", type: "textarea", placeholder: "Hosting support, keyholders…" },
        { id: "repos_docs", label: "Repos and docs", type: "textarea", placeholder: "Git repos, internal docs…" },
      ],
    },
    {
      id: "networking",
      label: "IPs and networking",
      fields: [
        { id: "static_ips", label: "Static IPs", type: "textarea", placeholder: "IPs, roles…" },
        { id: "domains", label: "Domains", type: "textarea", placeholder: "Domain names, purpose…" },
        { id: "dns", label: "DNS", type: "textarea", placeholder: "DNS provider, records…" },
        { id: "firewall", label: "Firewall rules", type: "textarea", placeholder: "Ports, rules summary…" },
      ],
    },
    {
      id: "billing",
      label: "Billing / VPS / credit card",
      fields: [
        { id: "provider", label: "Provider", type: "text", placeholder: "e.g. DigitalOcean, Hetzner" },
        { id: "plan", label: "Plan", type: "text", placeholder: "Droplet size, plan name…" },
        { id: "account_id", label: "Account / customer ID", type: "text", placeholder: "Account ID or email" },
        { id: "card_last4", label: "Card last 4 digits (optional)", type: "text", placeholder: "Last 4 only" },
        { id: "renewal_date", label: "Renewal date", type: "date" },
        { id: "billing_notes", label: "Billing notes", type: "textarea", placeholder: "Optional notes…" },
      ],
    },
  ],
};
