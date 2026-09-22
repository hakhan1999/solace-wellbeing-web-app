import {Suspense} from 'react';
import {Shell} from '@/components/solace/shell';
import {Programs} from '@/components/solace/programs';
export default function Page(){return <Shell><Suspense><Programs/></Suspense></Shell>}
