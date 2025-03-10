import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import MainLayout from '../layouts/MainLayout';

export default function Home() {
  const { t } = useTranslation('common');
  
  return (
    <MainLayout title="FusionAI Orchestration Tool for Blockchain">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            FusionAI <span className="text-blue-600">Orchestration Tool</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('home.tagline', 'Visually design, deploy, and optimize blockchain infrastructure with AI-driven orchestration')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card hover:shadow-lg transition-all">
            <h3 className="text-xl font-semibold text-blue-600 mb-3">
              {t('home.features.visual.title', 'Visual Workflows')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('home.features.visual.description', 'Intuitive drag-and-drop interface for designing blockchain deployments')}
            </p>
          </div>
          
          <div className="card hover:shadow-lg transition-all">
            <h3 className="text-xl font-semibold text-blue-600 mb-3">
              {t('home.features.ai.title', 'AI-Driven Assistance')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('home.features.ai.description', 'Intelligent recommendations and automated optimization for your blockchain deployments')}
            </p>
          </div>
          
          <div className="card hover:shadow-lg transition-all">
            <h3 className="text-xl font-semibold text-blue-600 mb-3">
              {t('home.features.blockchain.title', 'Multi-Chain Support')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('home.features.blockchain.description', 'Deploy across multiple blockchain technologies with cross-chain integrations')}
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/workspace">
            <button className="btn btn-primary py-3 px-8 rounded-lg">
              {t('home.cta', 'Start Building')}
            </button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
