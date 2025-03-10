import React, { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title = 'FusionAI Orchestrator Tool' 
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content="FusionAI Orchestrator Tool for Blockchain" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-gradient-to-r from-blue-800 to-purple-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            FusionAI Orchestrator
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className={`hover:text-blue-200 ${router.pathname === '/' ? 'text-blue-200 font-semibold' : ''}`}>
              Home
            </Link>
            <Link href="/admin" className={`hover:text-blue-200 ${router.pathname === '/admin' ? 'text-blue-200 font-semibold' : ''}`}>
              Admin
            </Link>
            <Link href="/employee" className={`hover:text-blue-200 ${router.pathname === '/employee' ? 'text-blue-200 font-semibold' : ''}`}>
              Employee
            </Link>
            <Link href="/analytics" className={`hover:text-blue-200 ${router.pathname === '/analytics' ? 'text-blue-200 font-semibold' : ''}`}>
              Analytics
            </Link>
            <Link href="/workspace" className={`hover:text-blue-200 ${router.pathname === '/workspace' ? 'text-blue-200 font-semibold' : ''}`}>
              Workspace
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm">
              Login
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">FusionAI Orchestrator Tool</h3>
              <p className="text-gray-400">Blockchain orchestration made simple</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-3">Resources</h4>
                <ul className="space-y-2">
                  <li><Link href="/docs" className="text-gray-400 hover:text-white">Documentation</Link></li>
                  <li><Link href="/api" className="text-gray-400 hover:text-white">API</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-gray-400 hover:text-white">About</Link></li>
                  <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3">Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link></li>
                  <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} FusionAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
