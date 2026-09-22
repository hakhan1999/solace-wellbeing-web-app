import {Suspense} from 'react';
import {Shell} from '@/components/solace/shell';
import {Employees} from '@/components/solace/employees';
export default function Page(){return <Shell><Suspense><Employees/></Suspense></Shell>}
