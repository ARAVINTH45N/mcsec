import { Link } from "@tanstack/react-router";
import { Mail, Linkedin, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Footer() {
  const { data: settings } = useSiteSettings();
  return (
    <footer className="mt-24 border-t border-border/60 bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <Logo size={44} textClassName="text-navy-foreground" />
          <p className="mt-4 max-w-md text-sm text-navy-foreground/70">
            The official Microsoft technology club of Saveetha Engineering College —
            empowering students through workshops, hackathons and hands-on learning
            in Microsoft technologies.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {settings?.whatsapp_url && (
              <a href={settings.whatsapp_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {settings?.linkedin_url && (
              <a href={settings.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 px-4 py-2 text-sm font-medium hover:bg-navy-foreground/10">
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
            )}
            {settings?.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 px-4 py-2 text-sm font-medium hover:bg-navy-foreground/10">
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-navy-foreground/60">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/" className="hover:text-primary-glow">Home</Link></li>
            <li><Link to="/activities" className="hover:text-primary-glow">Activities</Link></li>
            <li><Link to="/gallery" className="hover:text-primary-glow">Gallery</Link></li>
            <li><Link to="/community" className="hover:text-primary-glow">Community</Link></li>
            <li><Link to="/membership" className="hover:text-primary-glow">Join the Club</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-navy-foreground/60">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-navy-foreground/70">
            <li>Saveetha Engineering College</li>
            <li>Chennai, Tamil Nadu, India</li>
            {settings?.contact_email && <li>{settings.contact_email}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10 py-4 text-center text-xs text-navy-foreground/60">
        © {new Date().getFullYear()} Microsoft Club SEC. All rights reserved.
      </div>
    </footer>
  );
}
