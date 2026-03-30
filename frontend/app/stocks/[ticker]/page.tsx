import FicheValeurClient from './FicheValeurClient';

interface PageProps {
  params: Promise<{ ticker: string }>;
}

export default async function TickerPage({ params }: PageProps) {
  const { ticker } = await params;
  return <FicheValeurClient ticker={ticker} />;
}
