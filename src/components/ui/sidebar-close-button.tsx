"use client"

import { PanelLeftClose } from "lucide-react";
import { useSidebar } from "./sidebar";
import { Button } from "./button";

export function SidebarCloseButton() {
    const { toggleSidebar, state } = useSidebar();

    if (state === 'collapsed') {
        return null;
    }

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="md:block hidden h-7 w-7"
            onClick={toggleSidebar}
        >
            <PanelLeftClose />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    )
}
