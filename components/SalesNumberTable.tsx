import React, { useRef, useCallback } from 'react';
import { SalesNumber, Product, Status, PhoneNumberLabel, PositionLabel, ChannelType, ColumnDefinition } from '../types';
import MultiSelectDropdown from './MultiSelectDropdown';

const statusColors: { [key: string]: string } = {
  'Activo': 'bg-green-500 text-white',
  'Libre': 'bg-gray-500 text-white',
  'Revisar': 'bg-blue-500 text-white',
  'Bloqueado': 'bg-red-600 text-white',
  'Pendiente': 'bg-pink-500 text-white',
  'Reactivado': 'bg-teal-500 text-white',
  'Calentando': 'bg-indigo-500 text-white',
  'Abandonado': 'bg-purple-600 text-white',
  'En Revision': 'bg-yellow-500 text-black',
  'Programado': 'bg-orange-500 text-white',
  'Por Programar': 'bg-sky-500 text-white',
  '': 'bg-gray-700 text-white',
};

interface SalesNumberTableProps {
  title: string;
  numbers: SalesNumber[];
  columns: ColumnDefinition[];
  onColumnOrderChange: (newOrder: ColumnDefinition[]) => void;
  startEditing: (number: SalesNumber) => void;
  deleteSalesNumber: (id: string) => void;
  onOpenNotes: (number: SalesNumber) => void;
  editingNumberId: string | null;
  editNumberData: Partial<SalesNumber>;
  handleEditChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  updateSalesNumber: () => void;
  setEditingNumberId: (id: string | null) => void;
  products: Product[];
  statuses: Status[];
  phoneNumberLabels: PhoneNumberLabel[];
  positionLabels: PositionLabel[];
  channelTypes: ChannelType[];
}

const SalesNumberTable: React.FC<SalesNumberTableProps> = ({
  title, numbers, columns, onColumnOrderChange, startEditing, deleteSalesNumber,
  onOpenNotes, editingNumberId, editNumberData, handleEditChange, updateSalesNumber,
  setEditingNumberId, products, statuses, phoneNumberLabels, positionLabels, channelTypes
}) => {
  const dragColumnItem = useRef<number | null>(null);
  const dragOverColumnItem = useRef<number | null>(null);

  const handleColumnDragStart = (e: React.DragEvent<HTMLTableCellElement>, index: number) => {
      dragColumnItem.current = index;
  };

  const handleColumnDragEnter = (index: number) => {
      dragOverColumnItem.current = index;
  };

  const handleColumnDragEnd = () => {
      if (dragColumnItem.current !== null && dragOverColumnItem.current !== null && dragColumnItem.current !== dragOverColumnItem.current) {
          const _columns = [...columns];
          const draggedItem = _columns.splice(dragColumnItem.current, 1)[0];
          _columns.splice(dragOverColumnItem.current, 0, draggedItem);
          onColumnOrderChange(_columns);
      }
      dragColumnItem.current = null;
      dragOverColumnItem.current = null;
  };
  
  const renderCell = useCallback((sNumber: SalesNumber, column: ColumnDefinition) => {
      const isEditingRow = editingNumberId === sNumber.id;
      if (column.type === 'actions') {
          return (
              <td key={column.id} className="px-3 py-2 whitespace-nowrap text-right text-sm">
                  {isEditingRow ? (
                      <>
                          <button onClick={updateSalesNumber} className="text-green-400 p-1 hover:text-green-300" title="Guardar"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                          <button onClick={() => setEditingNumberId(null)} className="text-gray-400 p-1 hover:text-gray-300" title="Cancelar"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </>
                  ) : (
                      <>
                          <button onClick={() => startEditing(sNumber)} className="text-indigo-400 p-1 hover:text-indigo-300" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg></button>
                          <button onClick={() => onOpenNotes(sNumber)} className="text-blue-400 p-1 hover:text-blue-300" title="Notas"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                          <button onClick={() => deleteSalesNumber(sNumber.id)} className="text-red-400 p-1 hover:text-red-300" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </>
                  )}
              </td>
          );
      } else if (isEditingRow) {
          const currentEditData = editNumberData;
          const key = column.key as keyof SalesNumber;
          const commonInputClass = "p-1 w-full bg-gray-700 border border-gray-600 rounded text-white text-sm";
          switch (key) {
              case 'number': return <td key={column.id} className="px-3 py-2"><input type="text" name="number" value={currentEditData.number || ''} onChange={handleEditChange} className={commonInputClass} /></td>;
              case 'product': return <td key={column.id} className="px-3 py-2"><select name="product" value={currentEditData.product || ''} onChange={handleEditChange} className={commonInputClass}><option value="">Select</option>{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></td>;
              case 'status': return <td key={column.id} className="px-3 py-2"><select name="status" value={currentEditData.status || ''} onChange={handleEditChange} className={commonInputClass}><option value="">Select</option>{statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></td>;
              case 'addedToKommoSources': return <td key={column.id} className="px-3 py-2"><select name="addedToKommoSources" value={currentEditData.addedToKommoSources || 'No'} onChange={handleEditChange} className={commonInputClass}><option value="No">No</option><option value="Sí">Sí</option></select></td>;
              case 'channelType': return <td key={column.id} className="px-3 py-2"><select name="channelType" value={currentEditData.channelType || ''} onChange={handleEditChange} className={commonInputClass}><option value="">Select</option>{channelTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></td>;
              case 'activeCountries': return <td key={column.id} className="px-3 py-2"><MultiSelectDropdown label="" options={['AR', 'CO', 'VE', 'MX', 'CL'].map(c => ({ value: c, label: c }))} selectedValues={currentEditData.activeCountries || []} onChange={handleEditChange} /></td>;
              case 'phoneNumberLabel': return <td key={column.id} className="px-3 py-2"><select name="phoneNumberLabel" value={currentEditData.phoneNumberLabel || ''} onChange={handleEditChange} className={commonInputClass}><option value="">Select</option>{phoneNumberLabels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></td>;
              case 'positionLabel': return <td key={column.id} className="px-3 py-2"><select name="positionLabel" value={currentEditData.positionLabel || ''} onChange={handleEditChange} className={commonInputClass}><option value="">Select</option>{positionLabels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></td>;
              default: return <td key={column.id} className="px-3 py-2 text-sm text-gray-300">{String(currentEditData[key] || 'N/A')}</td>;
          }
      } else {
          const key = column.key as keyof SalesNumber;
          const value = sNumber[key];
          const commonCellClass = "px-3 py-2 whitespace-nowrap text-sm text-gray-300";
          if (column.type === 'status') {
              return <td key={column.id} className={commonCellClass}><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[sNumber.status] || ''}`}>{sNumber.status}</span></td>;
          } else if (column.type === 'kommo') {
              return <td key={column.id} className={commonCellClass}><span className={`px-2 py-1 rounded-full text-xs font-medium ${sNumber.addedToKommoSources === 'Sí' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>{sNumber.addedToKommoSources}</span></td>;
          } else if (column.type === 'array') {
              return <td key={column.id} className={commonCellClass}>{(value as string[])?.join(', ') || 'N/A'}</td>;
          } else {
              return <td key={column.id} className={commonCellClass}>{String(value || 'N/A')}</td>;
          }
      }
  }, [editingNumberId, editNumberData, handleEditChange, updateSalesNumber, setEditingNumberId, products, statuses, phoneNumberLabels, positionLabels, channelTypes, startEditing, deleteSalesNumber, onOpenNotes]);

  return (
    <section className="bg-gray-800 shadow-xl rounded-xl p-4 sm:p-6 mb-8 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.id}
                  draggable={column.id !== 'actions'}
                  onDragStart={(e) => handleColumnDragStart(e, index)}
                  onDragEnter={() => handleColumnDragEnter(index)}
                  onDragEnd={handleColumnDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-grab"
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {numbers.map(sNumber => (
              <tr key={sNumber.id} className="hover:bg-gray-700">
                {columns.map(column => renderCell(sNumber, column))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SalesNumberTable;
