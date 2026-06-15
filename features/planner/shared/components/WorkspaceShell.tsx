'use client';

import React from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

interface WorkspaceShellProps {
  topbar?: React.ReactNode;
  toolRail?: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  workspace: React.ReactNode;
}

export function WorkspaceShell({
  topbar,
  toolRail,
  leftSidebar,
  rightSidebar,
  workspace,
}: WorkspaceShellProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-900 text-slate-100">
      {topbar}
      <div className="flex flex-1 overflow-hidden">
        {/* Tool Rail */}
        {toolRail && (
          <div className="w-14 flex-shrink-0 flex flex-col overflow-y-auto border-r border-slate-700 bg-slate-800 z-10">
            {toolRail}
          </div>
        )}
        
        {/* Left Sidebar */}
        {leftSidebar && (
          <div className="flex w-[240px] flex-shrink-0 flex-col overflow-y-auto border-r border-slate-700 bg-slate-800 z-10">
            {leftSidebar}
          </div>
        )}
        
        {/* Main Workspace */}
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-white z-0 isolate">
          {workspace}
        </div>
        
        {/* Right Sidebar */}
        {rightSidebar && (
          <div className="w-[320px] flex-shrink-0 overflow-y-auto border-l border-slate-700 bg-slate-800 z-10">
            {rightSidebar}
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkspaceSplitPane({
  leftPanel,
  rightPanel,
  direction = 'horizontal',
}: {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <PanelGroup orientation={direction}>
        <Panel defaultSize={50} minSize={20}>
          <div className="h-full w-full relative">
            {leftPanel}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-600 hover:bg-blue-500 transition-colors cursor-col-resize" />

        <Panel defaultSize={50} minSize={20}>
          <div className="h-full w-full relative">
            {rightPanel}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
