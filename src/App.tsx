import { Layout } from './components/Layout';
import { useApp } from './state';
import { Overview } from './pages/Overview';
import { XRay } from './pages/XRay';
import { Simulator } from './pages/Simulator';
import { Learn } from './pages/Learn';
import { TopicPage } from './pages/Topic';
import { Methodology } from './pages/Methodology';

export function App() {
  const { route } = useApp();
  let page;
  switch (route.page) {
    case 'xray': page = <XRay findingId={route.findingId} />; break;
    case 'simulator': page = <Simulator focusId={route.findingId} />; break;
    case 'learn': page = <Learn />; break;
    case 'topic': page = <TopicPage topicId={route.topicId} key={route.topicId} />; break;
    case 'methodology': page = <Methodology />; break;
    default: page = <Overview />;
  }
  return <Layout><div className="fade-up" key={route.page + ('topicId' in route ? route.topicId : '')}>{page}</div></Layout>;
}
