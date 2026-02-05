"use client";

import React from 'react';

type SidePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

const SidePanel = ({ isOpen, onClose, children }: SidePanelProps) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-[75vw] sm:w-90 bg-(--background) shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-muted ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col text-foreground">
          <div className="flex-1 overflow-y-auto p-1">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default SidePanel;