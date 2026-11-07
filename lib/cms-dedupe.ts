/** Keep the most recently edited row if an earlier import created duplicate IDs.
 * This is a read projection only; it does not delete historical records.
 */
export function latestById(rows:Record<string,unknown>[]):Record<string,unknown>[]{
 const latest=new Map<string,Record<string,unknown>>();
 let unnamed=0;
 for(const row of rows){
  const id=typeof row.id==='string'&&row.id?row.id:'__row_'+(++unnamed);
  const previous=latest.get(id);
  const changed=String(row.updated_at||row.created_at||'');
  const oldChanged=String(previous?.updated_at||previous?.created_at||'');
  if(!previous||changed>=oldChanged)latest.set(id,row);
 }
 return [...latest.values()];
}
