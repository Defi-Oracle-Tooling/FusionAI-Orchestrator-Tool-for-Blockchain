import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Home() {
  const { t } = useTranslation('common');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900">
      <Head>
        <title>FusionAI Orchestration Tool for Blockchain</title>
        <meta name="description" content="Advanced orchestration tool leveraging AI and blockchain technology" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            FusionAI <span className="text-blue-400">Orchestration Tool</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('home.tagline', 'Visually design, deploy, and optimize blockchain infrastructure with AI-driven orchestration')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 bg-opacity-70 p-6 rounded-xl hover:shadow-lg transition-all">
            <h3 className="text-xl font-semibold text-blue-300 mb-3">
              {t('home.features.visual.title', 'Visual Workflows')}
            </h3>
            <p className="text-gray-300">
              {t('home.features.visual.description', 'Intuitive drag-and-drop interface for designing blockchain deployments')}
            </p>
          </div>
          
          <div className="bg-gray-800 bg-opacity-70 p-6 rounded-xl hover:shadow-lg transition-all">
            <h3 className="text-xl font-semibold text-blue-300 mb-3">
              {t('home.features.ai.title', 'AI-Driven Assistance')}
            </h3>
            <p className="text-gray-300">
              {t('home.features.ai.description', 'Intelligent recommendations and automated optimization for your blockchain deployments')}
            </p>
          </div>
          
          <div className="bg-gray-800 bg-opacity-70 p-6 rounded-xl hover:shadow-lg transition-all">
            <h3 className="text-xl font-semibold text-blue-300 mb-3">
              {t('home.features.blockchain.title', 'Multi-Chain Support')}
            </h3>
            <p className="text-gray-300">
              {t('home.features.blockchain.description', 'Deploy across multiple blockchain technologies with cross-chain integrations')}
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/workspace">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors">
              {t('home.cta', 'Start Building')}
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}