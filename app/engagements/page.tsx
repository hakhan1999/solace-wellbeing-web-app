import {Suspense} from 'react';
import {Shell} from '@/components/solace/shell';
import {Engagements} from '@/components/solace/engagements';
export default function Page(){return <Shell><Suspense><Engagements/></Suspense></Shell>}
