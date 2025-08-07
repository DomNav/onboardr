'use client';

import React, { useState } from 'react';
import { FloatingSoroButton } from '@/components/FloatingSoroButton';
import { SoroSlideOver } from '@/components/SoroSlideOver';

export function SoroProvider() {
  const [isSoroOpen, setIsSoroOpen] = useState(false);
  
  return (
    <>
      <FloatingSoroButton onClick={() => setIsSoroOpen(true)} />
      <SoroSlideOver isOpen={isSoroOpen} onClose={() => setIsSoroOpen(false)} />
    </>
  );
}