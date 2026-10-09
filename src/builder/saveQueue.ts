export type SaveTask=()=>Promise<void>

export function createSaveQueue(){
  let tail:Promise<void>=Promise.resolve()
  return (task:SaveTask)=>{
    const run=tail.catch(()=>undefined).then(task)
    tail=run.then(()=>undefined,()=>undefined)
    return run
  }
}
