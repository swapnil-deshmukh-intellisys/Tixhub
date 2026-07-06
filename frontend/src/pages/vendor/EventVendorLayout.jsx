import { Bell, CalendarDays, ChevronRight, CircleDollarSign, ClipboardList, FilePlus2, LayoutDashboard, LogOut, Menu, NotebookPen, Search, Settings2, TicketCheck, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "./EventVendorLayout.css";

const nav = [
  ["overview", "Event Dashboard", LayoutDashboard], ["add", "Add Event", FilePlus2],
  ["manage", "Manage Events", Settings2], ["bookings", "Bookings", TicketCheck],
  ["calendar", "Calendar", CalendarDays], ["revenue", "Revenue", CircleDollarSign], ["notes", "Notes", NotebookPen],
];
const user = () => { try { return JSON.parse(localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser") || "{}"); } catch { return {}; } };

export default function EventVendorLayout({ children, search, setSearch }) {
  const navigate=useNavigate(), location=useLocation(), [params]=useSearchParams(), [mobile,setMobile]=useState(false), [profile,setProfile]=useState(false);
  const currentUser=user(), name=currentUser.name || currentUser.businessName || "Event Vendor", initials=name.split(" ").map((x)=>x[0]).join("").slice(0,2).toUpperCase();
  const active=location.pathname.includes("/add") ? "add" : params.get("tab") || "overview";
  const go=(key)=>{setMobile(false);navigate(key==="add"?"/vendor/event/add":key==="overview"?"/vendor/events":`/vendor/events?tab=${key}`);};
  const logout=()=>{localStorage.clear();sessionStorage.clear();navigate("/");};
  return <div className="ev-shell">
    <button className="ev-mobile-menu" onClick={()=>setMobile(true)}><Menu size={20}/></button>
    <aside className={`ev-sidebar ${mobile?"open":""}`}>
      <div className="ev-brand"><span><CalendarDays size={21}/></span><strong>TixHub</strong><button onClick={()=>setMobile(false)}><X size={19}/></button></div>
      <div className="ev-switch"><button className="active">Event Panel</button><button onClick={()=>navigate("/vendor-dashboard")}>All Services</button></div>
      <nav><p>EVENT MANAGEMENT</p>{nav.map(([key,label,Icon])=><button key={key} className={active===key?"active":""} onClick={()=>go(key)}><Icon size={17}/><span>{label}</span></button>)}</nav>
      <button className="ev-account" onClick={()=>setProfile(!profile)}><i>{initials}</i><span><strong>{name}</strong><small>Event Vendor</small></span><ChevronRight size={15}/></button>
    </aside>
    {mobile&&<button className="ev-backdrop" onClick={()=>setMobile(false)} aria-label="Close menu"/>}
    <main className="ev-main">
      <header className="ev-header"><label><Search size={17}/><input value={search||""} onChange={(e)=>setSearch?.(e.target.value)} placeholder="Search events, bookings or notes"/></label><div><button className="ev-bell"><Bell size={19}/><i/></button><button className="ev-profile" onClick={()=>setProfile(!profile)}><i>{initials}</i><span><strong>{name}</strong><small>Event Vendor</small></span><ChevronRight size={15}/></button>{profile&&<section className="ev-profile-pop"><strong>{name}</strong><small>{currentUser.email}</small><button onClick={()=>navigate("/vendor-dashboard")}><ClipboardList size={15}/> All services</button><button onClick={logout}><LogOut size={15}/> Logout</button></section>}</div></header>
      <div className="ev-content">{children}</div>
    </main>
  </div>;
}
