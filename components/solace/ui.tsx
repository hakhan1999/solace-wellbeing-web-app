'use client';
import {ReactNode} from 'react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Table,TableHeader,TableHead,TableBody,TableRow,TableCell} from '@/components/ui/table';
import {Progress} from '@/components/ui/progress';
import {Search,ArrowUpRight,Plus} from 'lucide-react';
export function Pick({value,onChange,options,label,className=''}:{value:string;onChange:(v:string)=>void;options:(string|{value:string;label:string})[];label:string;className?:string}){return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className={'pick '+className}><SelectValue placeholder={label}/></SelectTrigger><SelectContent>{options.map(o=>{const v=typeof o==='string'?o:o.value;return <SelectItem key={v} value={v}>{typeof o==='string'?o:o.label}</SelectItem>})}</SelectContent></Select>}
export function Badge({children,tone=''}:{children:ReactNode;tone?:string}){return <span className={'badge '+(tone||(children==='Active'||children==='Completed'?'green':children==='Draft'||children==='Pending'?'amber':'neutral'))}>{children}</span>}
export function Heading({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:ReactNode}){return <div className="page-heading"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>}
export function Action({children,onClick,secondary=false,disabled=false,type='button'}:{children:ReactNode;onClick?:()=>void;secondary?:boolean;disabled?:boolean;type?:'button'|'submit'}){return <button type={type} disabled={disabled} onClick={onClick} className={secondary?'button secondary':'button'}>{children}</button>}
export function Add({children,onClick}:{children:ReactNode;onClick:()=>void}){return <Action onClick={onClick}><Plus size={17}/>{children}</Action>}
export function SearchBox({value,onChange,placeholder='Search…'}:{value:string;onChange:(v:string)=>void;placeholder?:string}){return <div className="search-field"><Search size={17}/><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/></div>}
export function DataTable({headers,children}:{headers:string[];children:ReactNode}){return <Table className="data-table"><TableHeader><TableRow>{headers.map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{children}</TableBody></Table>}
export {TableRow as Row,TableCell as Cell};
export function Empty({title='Nothing here yet',text='Create a record to get started.'}:{title?:string;text?:string}){return <div className="empty"><h3>{title}</h3><p>{text}</p></div>}
export function Meter({value}:{value:number}){return <div className="meter"><Progress value={value}/><span>{value}%</span></div>}
export function Avatar({name,color,small=false}:{name:string;color?:string;small?:boolean}){return <span className={'avatar '+(small?'small':'')} style={color?{background:color+'16',color}:undefined}>{name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>}
export function TextLink({children,onClick}:{children:ReactNode;onClick:()=>void}){return <button className="text-link" onClick={onClick}>{children}<ArrowUpRight size={15}/></button>}
