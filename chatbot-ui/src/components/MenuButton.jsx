import React from 'react'
import {useNavigate} from 'react-router-dom'


export default function MenuButton({label, route, onClick, icon, style}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if(onClick) onClick()
    else if (route) navigate(route)
  }

  return (
    <button 
     className='w-4/5 max-w-xs px-6 py-4 my-3 border-2 border-neutral-800 
     rounded-xl text-lg font-semibold text-neutral-800 bg-white 
     hover:bg-neutral-100 active:scale-[0.98] transition-all'
     onClick={handleClick}
     style={style}
     >
      {icon && <span className='mr-2'>{icon}</span>}
      <span className='menu-label'>{label}</span>
     </button>
  )

}
