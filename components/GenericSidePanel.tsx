import React, { useState, useRef } from 'react';

interface Label {
  id: string;
  name: string;
}

interface GenericSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  labels: Label[];
  addLabel?: (collectionName: string, input: string, setInput: (v: string) => void, list: any[], type: string) => void;
  deleteLabel?: (id: string, collectionName: string, name: string, type: string) => void;
  handleReorder?: (draggedIndex: number, droppedIndex: number, list: any[], collectionName: string) => void;
  panelTitle: string;
  collectionName: string;
  itemType: string;
  isCountriesFixed?: boolean;
}

const GenericSidePanel: React.FC<GenericSidePanelProps> = ({
  isOpen, onClose, labels, addLabel, deleteLabel, handleReorder, panelTitle, collectionName, itemType, isCountriesFixed = false
}) => {
  const [newItemInput, setNewItemInput] = useState('');
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const onAddItem = () => {
    if (addLabel) addLabel(collectionName, newItemInput, setNewItemInput, labels, itemType);
  };
  const onDeleteItem = (id: string, name: string) => {
    if (deleteLabel) deleteLabel(id, collectionName, name, itemType);
  };
  const onDragEnd = () => {
      if (handleReorder && dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
          handleReorder(dragItem.current, dragOverItem.current, labels, collectionName);
      }
      dragItem.current = null;
      dragOverItem.current = null;
  };

  return (
    <div className={`fixed inset-0 z-50 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`}>
      <div className="absolute inset-0 bg-black bg-opacity-70" onClick={onClose}></div>
      <div className="relative bg-gray-800 w-full sm:w-96 h-full shadow-lg ml-auto p-6 flex flex-col border-l border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">{panelTitle}</h2>
          <button onClick={onClose} className="text-gray-400 p-1 rounded-full hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        {!isCountriesFixed && (
          <div className="flex mb-4">
            <input type="text" placeholder={`Nuevo ${itemType}`} value={newItemInput} onChange={(e) => setNewItemInput(e.target.value)} className="flex-1 p-3 bg-gray-700 text-white rounded-l-lg border border-gray-600" />
            <button onClick={onAddItem} className="bg-indigo-600 text-white px-6 py-3 rounded-r-lg hover:bg-indigo-700">Añadir</button>
          </div>
        )}
        <ul className="space-y-2 overflow-y-auto flex-1">
          {labels.map((item, index) => (
            <li
              key={item.id}
              draggable={!isCountriesFixed}
              onDragStart={() => dragItem.current = index}
              onDragEnter={() => dragOverItem.current = index}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex justify-between items-center bg-gray-700 p-3 rounded-md ${!isCountriesFixed ? 'cursor-grab' : ''}`}
            >
              <span className="text-gray-200">{item.name}</span>
              {!isCountriesFixed && (
                <button onClick={() => onDeleteItem(item.id, item.name)} className="text-red-400 p-1 hover:text-red-300" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GenericSidePanel;
