import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Full-page SkeletonLoader including header, sidebar, and content
export function FullPageSkeletonLoader() {
  return (
    <div className="App">
      <header className="header">
        <Skeleton width={100} height={40} /> {/* Logo */}
        <Skeleton circle={true} width={40} height={40} /> {/* User avatar */}
      </header>
      <div className="main-content">
        <aside className="sidebar">
          <Skeleton count={4} height={30} className="sidebar-item" /> {/* Sidebar items */}
        </aside>
        <main>
          <Skeleton height={50} width="50%" /> {/* Page title */}
          <Skeleton count={3} height={200} className="content-block" /> {/* Content blocks */}
        </main>
      </div>
    </div>
  );
}

// Content-only SkeletonLoader for just the main content area
export function ContentSkeletonLoader() {
  return (
    <main>
      <Skeleton height={50} width="50%" /> {/* Page title */}
      <Skeleton count={3} height={200} className="content-block" /> {/* Content blocks */}
    </main>
  );
}

