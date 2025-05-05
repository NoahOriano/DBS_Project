import React, { useEffect, useState } from 'react';
import api from '../api';

type Rate = {
  Rate_ID?: number;
  Ward: string;
  Daily_Rate: number;
  Effective_From: string;  // yyyy-mm-dd
  Effective_To:   string | null;
};

export default function BedRateAdmin() {
  const [rows,setRows]   = useState<Rate[]>([]);
  const [edit,setEdit]   = useState<Rate|null>(null);
  const [err,setErr]     = useState<string|null>(null);

  useEffect(() => { api.get<Rate[]>('/admin/bed-rates').then(r=>setRows(r.data)); }, []);

  const save = async () => {
    const r = edit!;
    r.Rate_ID
      ? await api.put(`/admin/bed-rates/${r.Rate_ID}`, r)
      : await api.post('/admin/bed-rates', r);
    setEdit(null);
    setRows((await api.get<Rate[]>('/admin/bed-rates')).data);
  };

  const del = async (id:number) => {
    await api.delete(`/admin/bed-rates/${id}`);
    setRows(rows.filter(r=>r.Rate_ID!==id));
  };

  return (
    <div className="page">
      <h2>Bed Rates</h2>
      {err && <p className="error">{err}</p>}

      <table>
        <thead><tr><th>Ward</th><th>Rate/day</th><th>From</th><th>To</th><th/></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.Rate_ID}>
              <td>{r.Ward}</td><td>${r.Daily_Rate.toFixed(2)}</td>
              <td>{r.Effective_From}</td><td>{r.Effective_To||'—'}</td>
              <td><button onClick={()=>setEdit(r)}>✎</button>
                  <button onClick={()=>del(r.Rate_ID!)}>🗑</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={()=>setEdit({Ward:'',Daily_Rate:0,Effective_From:'',Effective_To:null})}>
        + New Rate
      </button>

      {edit && (
        <Editor title={edit.Rate_ID?'Edit Rate':'New Rate'}>
          <input placeholder="Ward" value={edit.Ward}
                 onChange={e=>setEdit({...edit,Ward:e.target.value})}/>
          <input type="number" step="0.01" value={edit.Daily_Rate}
                 onChange={e=>setEdit({...edit,Daily_Rate:+e.target.value})}/>
          <input type="date" value={edit.Effective_From}
                 onChange={e=>setEdit({...edit,Effective_From:e.target.value})}/>
          <input type="date" value={edit.Effective_To||''}
                 onChange={e=>setEdit({...edit,Effective_To:e.target.value||null})}/>
          <Actions onSave={save} onCancel={()=>setEdit(null)}/>
        </Editor>
      )}
    </div>
  );
}

const Editor: React.FC<{title:string;children:React.ReactNode}> = ({title,children}) =>
  <div className="editor"><h4>{title}</h4>{children}</div>;
const Actions:React.FC<{onSave():void;onCancel():void}> = ({onSave,onCancel}) =>
  <p><button onClick={onSave}>Save</button><button onClick={onCancel}>Cancel</button></p>;
