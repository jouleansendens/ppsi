import { Home, Users, UsersRound, FileText, LogOut, Moon, Sun, ChevronLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Data Warga", url: "/warga", icon: Users },
  { title: "Data Keluarga", url: "/keluarga", icon: UsersRound },
  { title: "Laporan", url: "/laporan", icon: FileText },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r" style={{ '--sidebar-width': '240px', '--sidebar-width-icon': '68px' } as React.CSSProperties}>
      {/* Header */}
      <SidebarHeader>
        <div className={cn(
          "flex items-center gap-3 px-4 py-4 transition-all duration-300",
          collapsed && "justify-center px-3"
        )}>
          <div className={cn(
            "flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg transition-all duration-300",
            collapsed ? "h-10 w-10" : "h-11 w-11"
          )}>
            <Users className={cn(
              "text-white transition-all duration-300",
              collapsed ? "h-5 w-5" : "h-6 w-6"
            )} />
          </div>
          
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-base font-bold tracking-tight">RW 08</span>
              <span className="text-xs text-muted-foreground">Sistem Data Warga</span>
            </div>
          )}
          
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <Separator />

      {/* Content */}
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="group relative hover:bg-accent/50 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-medium shadow-sm"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className={cn(
          "flex flex-col gap-2 p-3 transition-all duration-300",
          collapsed && "p-3"
        )}>
          
          {/* User Info Card */}
          <div className={cn(
            "flex items-center gap-3 rounded-lg bg-muted/50 p-2.5 transition-all duration-300 border",
            collapsed && "justify-center p-3"
          )}>
            <Avatar className={cn(
              "shrink-0 transition-all duration-300",
              collapsed ? "h-9 w-9" : "h-9 w-9"
            )}>
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                {user?.email?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">
                  {user?.email || "Admin"}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  Administrator
                </p>
              </div>
            )}
          </div>

          <Separator className="my-1" />

          {/* Action Buttons */}
          <div className={cn(
            "flex gap-2",
            collapsed ? "flex-col" : "flex-row"
          )}>
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size={collapsed ? "icon" : "sm"}
              className={cn(
                "transition-all duration-300 shrink-0",
                collapsed ? "w-full" : "flex-1"
              )}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {!collapsed && (
                <span className="ml-2 text-xs">
                  {theme === "dark" ? "Terang" : "Gelap"}
                </span>
              )}
            </Button>

            {/* Logout Button */}
            <Button
              variant="destructive"
              size={collapsed ? "icon" : "sm"}
              className={cn(
                "transition-all duration-300 shrink-0",
                collapsed ? "w-full" : "flex-1"
              )}
              onClick={signOut}
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2 text-xs">Keluar</span>}
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}