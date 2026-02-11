import { Metadata } from 'next';
import { apiClient } from '@/lib/api';
import ScriptDetailClient from './ScriptDetailClient';

interface Props {
  params: { scriptId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const script = await apiClient.getScriptById(params.scriptId);
    return {
      title: `${script.title} - 25PageScript`,
      description: script.logline,
      openGraph: {
        title: script.title,
        description: script.logline,
        type: 'article',
        authors: [script.writer.name],
      },
    };
  } catch {
    return {
      title: 'Script Not Found - 25PageScript',
    };
  }
}

export default async function ScriptDetailPage({ params }: Props) {
  let script = null;
  let error = null;

  try {
    script = await apiClient.getScriptById(params.scriptId);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load script';
  }

  return <ScriptDetailClient initialScript={script} initialError={error} scriptId={params.scriptId} />;
}
