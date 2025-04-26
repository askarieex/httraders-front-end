import React from 'react';
import Avatar from './ui/Avatar';

const AvatarDemo = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-card">
      <h2 className="text-xl font-display font-semibold mb-6">Avatar Component Examples</h2>
      
      <section className="mb-8">
        <h3 className="text-lg font-medium text-neutral-800 mb-3">Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-center">
            <Avatar size="xs" name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">xs</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar size="sm" name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">sm</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar size="md" name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">md</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar size="lg" name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">lg</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar size="xl" name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">xl</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar size="2xl" name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">2xl</span>
          </div>
        </div>
      </section>
      
      <section className="mb-8">
        <h3 className="text-lg font-medium text-neutral-800 mb-3">Variants</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-center">
            <Avatar variant="circular" name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">circular</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar variant="rounded" name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">rounded</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar variant="square" name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">square</span>
          </div>
        </div>
      </section>
      
      <section className="mb-8">
        <h3 className="text-lg font-medium text-neutral-800 mb-3">With Images</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar 
            src="https://randomuser.me/api/portraits/men/75.jpg" 
            alt="User Avatar"
            name="John Doe" 
          />
          <Avatar 
            src="https://randomuser.me/api/portraits/women/68.jpg" 
            alt="User Avatar"
            name="Jane Smith" 
          />
          <Avatar 
            src="https://randomuser.me/api/portraits/men/32.jpg" 
            alt="User Avatar"
            name="Robert Johnson" 
          />
          <Avatar 
            src="https://invalid-image-url.jpg" 
            alt="User with invalid image"
            name="Fallback User" 
          />
        </div>
      </section>
      
      <section className="mb-8">
        <h3 className="text-lg font-medium text-neutral-800 mb-3">Custom Styling</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar 
            name="John Doe" 
            className="border-2 border-primary-500"
          />
          <Avatar 
            name="Jane Smith" 
            fallbackClassName="bg-secondary-100 text-secondary-700"
          />
          <Avatar 
            name="Custom Background" 
            fallbackClassName="bg-warning text-white"
          />
          <Avatar 
            name="Dark Mode" 
            fallbackClassName="bg-neutral-800 text-white"
          />
        </div>
      </section>
      
      <section>
        <h3 className="text-lg font-medium text-neutral-800 mb-3">Initials Display</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-center">
            <Avatar name="John Doe" />
            <span className="mt-2 text-sm text-neutral-500">John Doe → JD</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar name="Jane Smith" />
            <span className="mt-2 text-sm text-neutral-500">Jane Smith → JS</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar name="Single" />
            <span className="mt-2 text-sm text-neutral-500">Single → S</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar name="Multiple Word Name" />
            <span className="mt-2 text-sm text-neutral-500">Multiple Word Name → MN</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AvatarDemo; 