import Dashboard from '../components/pages/Dashboard';
import LearningPath from '../components/pages/LearningPath';
import MockInterview from '../components/pages/MockInterview';
import PortfolioBuilder from '../components/pages/PortfolioBuilder';
import Redeem from '../components/pages/Redeem';

export const privateRoutes = [
    {
        path: '/',
        component: Dashboard,
    },
    {
        path: '/learning-path',
        component: LearningPath,
    },
    {
        path: '/mock-interview',
        component: MockInterview,
    },
    {
        path: '/portfolio-builder',
        component: PortfolioBuilder,
    },
    {
        path: '/redeem',
        component: Redeem,
    },
];