import { X } from 'lucide-react';
import type { Member } from '../types';

interface MemberFormProps {
  member: Member;
  index: number;
  canRemove: boolean;
  onChange: (index: number, field: keyof Member, value: string | File | null) => void;
  onRemove: (index: number) => void;
}

export default function MemberForm({
  member,
  index,
  canRemove,
  onChange,
  onRemove,
}: MemberFormProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Integrante {index + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
            aria-label="Eliminar integrante"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor={`member-name-${index}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id={`member-name-${index}`}
            required
            value={member.fullName}
            onChange={(e) => onChange(index, 'fullName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ingrese el nombre completo"
          />
        </div>

        <div>
          <label
            htmlFor={`member-email-${index}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Correo institucional <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id={`member-email-${index}`}
            required
            value={member.institutionalEmail}
            onChange={(e) => onChange(index, 'institutionalEmail', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="ejemplo@pukllasunchis.edu.pe"
          />
        </div>

        <div>
          <label
            htmlFor={`member-phone-${index}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Número de celular <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id={`member-phone-${index}`}
            required
            value={member.phoneNumber}
            onChange={(e) => onChange(index, 'phoneNumber', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="999 999 999"
          />
        </div>

        <div>
          <label
            htmlFor={`member-receipt-${index}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Comprobante de pago <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id={`member-receipt-${index}`}
            required
            accept="image/*,.pdf"
           onChange={(e) => {
  const file = e.target.files?.[0] || null;

  if (file && file.size > 50 * 1024 * 1024) {
    alert('⚠️ El comprobante debe ser menor a 50MB');
    return;
  }

  onChange(index, 'paymentReceipt', file);
}}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
          />
          <p className="mt-1 text-sm text-gray-500">
            Formato: imagen o PDF
          </p>
                    <p className="mt-1 text-sm text-red-600">
⚠️ El comprobante de pago debe pesar menos de 50MB
</p>
          {member.paymentReceipt && (
            <p className="mt-2 text-sm text-green-600">
              Archivo seleccionado: {member.paymentReceipt.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
