import {Suspense} from 'react';
import {Shell} from '@/components/solace/shell';
import {Reports} from '@/components/solace/reports';
export default function Page(){return <Shell><Suspense><Reports/></Suspense></Shell>}
