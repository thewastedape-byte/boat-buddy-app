export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) { alert('No data to export.'); return }
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? ''
        const str = String(val).replace(/"/g, '""')
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str
      }).join(',')
    )
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportJobs(jobs: any[]) {
  const rows = jobs.map(j => ({
    'Work Order #': j.workOrderNum || j.id || '',
    'Date': j.date || j.created_at || '',
    'Vessel': j.vessel || j.symptom?.substring(0, 40) || '',
    'Problem': j.symptom || j.problemDesc || '',
    'Status': j.status || 'complete',
    'Tech': j.techName || '',
    'Parts Total': j.partsTotal || '',
    'Labor Total': j.laborTotal || '',
    'Grand Total': j.grandTotal || '',
    'Customer': j.customerName || '',
    'Customer Email': j.customerEmail || '',
  }))
  downloadCSV(`boat-buddy-jobs-${new Date().toISOString().slice(0,10)}.csv`, rows)
}

export function exportCustomers(customers: any[]) {
  const rows = customers.map(c => ({
    'Name': c.name || '',
    'Email': c.email || '',
    'Phone': c.phone || '',
    'Address': c.address || '',
    'Notes': c.notes || '',
  }))
  downloadCSV(`boat-buddy-customers-${new Date().toISOString().slice(0,10)}.csv`, rows)
}

export function exportParts(parts: any[]) {
  const rows = parts.map(p => ({
    'Part Name': p.name || '',
    'Part Number': p.part_number || '',
    'Barcode': p.barcode || '',
    'Qty in Stock': p.qty ?? '',
    'Min Qty': p.min_qty ?? '',
    'Unit Price': p.unit_price ?? '',
    'Supplier': p.supplier || '',
    'Location': p.location || '',
  }))
  downloadCSV(`boat-buddy-inventory-${new Date().toISOString().slice(0,10)}.csv`, rows)
}

export function exportRepairLog(log: any[]) {
  const rows = log.map(e => ({
    'Date': e.date || '',
    'Vessel': e.vessel || '',
    'Engine': e.engine || '',
    'Symptom': e.symptom || '',
    'Diagnosis': e.diagnosis || '',
    'Parts': e.parts ? JSON.stringify(e.parts) : '',
    'Labor Hours': e.laborHours || '',
    'Notes': e.notes || '',
  }))
  downloadCSV(`boat-buddy-repair-log-${new Date().toISOString().slice(0,10)}.csv`, rows)
}
