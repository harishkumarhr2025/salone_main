import { forwardRef } from 'react';
import { Typography, Box, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { alpha } from '@mui/material/styles';

const PrintableGuestTable = forwardRef(
  ({ dailyData, totalRevenue, totalGST, totalRoomRent }, ref) => {
    const theme = useTheme();

    // Flatten all guests from all days
    const allGuests = dailyData.flatMap((day) => day.guests);

    const getDateRange = () => {
      if (!dailyData.length) return '';

      const dates = dailyData.map((day) => dayjs(day.date, 'DD-MM-YYYY')).sort((a, b) => a - b);

      const startDate = dates[0].format('DD MMM YYYY');
      const endDate = dates[dates.length - 1].format('DD MMM YYYY');

      return `${startDate} - ${endDate}`;
    };

    const getGuestDocuments = (guest = {}) => {
      const documents = [];
      const seenUrls = new Set();

      const addDocument = (label, url) => {
        if (!url || typeof url !== 'string') return;
        const cleanUrl = url.trim();
        if (!cleanUrl || seenUrls.has(cleanUrl)) return;
        seenUrls.add(cleanUrl);
        documents.push({ label, url: cleanUrl });
      };

      addDocument('ID Front', guest?.Guest_ID_Proof?.[0]?.imageUrl || guest?.aadharFront);
      addDocument('ID Back', guest?.Guest_ID_Proof?.[1]?.imageUrl || guest?.aadharBack);
      addDocument('Guest Photo', guest?.Guest_picture);

      if (Array.isArray(guest?.Guest_ID_Proof)) {
        guest.Guest_ID_Proof.forEach((proof, index) => {
          if (index < 2) return;
          addDocument(`Proof ${index + 1}`, proof?.imageUrl);
        });
      }

      return documents;
    };

    return (
      <div ref={ref} style={{ padding: 24 }}>
        {/* Print Header */}

        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
            padding: 3,
            backgroundColor: '#FFFFFF',
            color: '#000000',
            borderRadius: 2,
            border: '2px solid #000000',
          }}
        >
             <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: '#1a365d', mb: 1 }}>
               Likeme Salon
          </Typography>
          <Typography variant="subheading1" gutterBottom sx={{ mb: 1, display: 'block' }}>
            No 8, Platform Road, Seshadripuram, Bengaluru - 560020, Karnataka, India
          </Typography>
             <Typography variant="subheading1" sx={{ mb: 1 }}>
               Phone: 9900064328 | Email: contact@likemesalon.com
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
            Guest Report
          </Typography>
          <Typography variant="body2">
            Report Period: {getDateRange()} • Generated on: {dayjs().format('DD MMM YYYY hh:mm A')}
          </Typography>
        </Box>

        <Box sx={{ mb: 4, pageBreakInside: 'avoid' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
            Financial Summary
          </Typography>

          {/* Key Metrics */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 3,
              mb: 4,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderLeft: '4px solid #10b981',
                backgroundColor: alpha('#10b981', 0.1),
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ₹{totalRevenue?.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="body2">Total Revenue</Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderLeft: '4px solid #f59e0b',
                backgroundColor: alpha('#f59e0b', 0.1),
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ₹{totalGST?.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="body2">Total GST</Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderLeft: '4px solid #3b82f6',
                backgroundColor: alpha('#3b82f6', 0.1),
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ₹{totalRoomRent?.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="body2">Total Room Rent</Typography>
            </Box>
          </Box>

          {/* Daily Financial Breakdown */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Daily Financial Records
          </Typography>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: 24,
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#2d3748',
                  color: 'white',
                }}
              >
                <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Guests</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Room Rent</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>GST</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f7fafc',
                  }}
                >
                  <td style={{ padding: '12px' }}>{day.date}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{day.count}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    ₹{day.dailyRoomRent?.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    ₹{day.dailyGST?.toLocaleString('en-IN')}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontWeight: 600,
                    }}
                  >
                    ₹{day.dailyTotal?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
            Guest Details & Uploaded Documents
          </Typography>

          {allGuests.map((guest, index) => {
            const guestDocuments = getGuestDocuments(guest);
            const isLastGuest = index === allGuests.length - 1;

            return (
              <div key={index} className="guest-section">
                <div className="guest-details-page">
                  <div
                    style={{
                      border: '1px solid #d7dee7',
                      borderRadius: 10,
                      padding: 16,
                      marginBottom: 20,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Guest {index + 1}: {guest.Guest_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#475569' }}>
                      Room {guest.Room_no || '-'} | {guest.Room_type || '-'} | {guest.Guest_type || '-'}
                    </Typography>

                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 13,
                      }}
                    >
                      <tbody>
                        {[
                          ['Contact', guest.Contact_number || '-'],
                          ['Payment Type', guest.Payment_type || '-'],
                          ['Total Amount', guest?.grand_total ? `₹${guest.grand_total?.toLocaleString('en-IN')}` : '-'],
                          ['Check-In', dayjs(guest?.Arrival_date).format('DD MMM YYYY, hh:mm A')],
                          [
                            'Check-Out',
                            guest.Checkout_date
                              ? dayjs(guest?.Checkout_date).format('DD MMM YYYY, hh:mm A')
                              : 'Not checkout',
                          ],
                          ['Uploaded Files', guestDocuments.length ? `${guestDocuments.length} file(s)` : 'No files'],
                        ].map(([label, value], rowIndex) => (
                          <tr
                            key={`${index}-${rowIndex}`}
                            style={{
                              borderBottom: '1px solid #eef2f7',
                              backgroundColor: rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff',
                            }}
                          >
                            <td style={{ padding: '10px 12px', fontWeight: 600, width: '32%' }}>{label}</td>
                            <td style={{ padding: '10px 12px' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {guestDocuments.map((doc, docIndex) => {
                  const isLastDocument = docIndex === guestDocuments.length - 1;
                  const shouldBreakAfter = !isLastGuest || !isLastDocument;

                  return (
                    <div
                      key={`${index}-photo-${docIndex}`}
                      className="guest-photo-page"
                      style={{
                        pageBreakAfter: shouldBreakAfter ? 'always' : 'auto',
                        breakAfter: shouldBreakAfter ? 'page' : 'auto',
                      }}
                    >
                      <Typography variant="h6" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>
                        {guest.Guest_name || 'Guest'} - {doc.label}
                      </Typography>
                      <div
                        style={{
                          width: '100%',
                          minHeight: '88vh',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #d7dee7',
                          borderRadius: 8,
                          overflow: 'hidden',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <img
                          src={doc.url}
                          alt={`${guest.Guest_name || 'Guest'} ${doc.label}`}
                          style={{
                            width: '100%',
                            height: '88vh',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {!guestDocuments.length && (
                  <div
                    style={{
                      border: '1px dashed #cbd5e1',
                      borderRadius: 8,
                      padding: 16,
                      marginTop: 12,
                      marginBottom: 32,
                      pageBreakAfter: isLastGuest ? 'auto' : 'always',
                      breakAfter: isLastGuest ? 'auto' : 'page',
                    }}
                  >
                    <Typography variant="body1" sx={{ textAlign: 'center' }}>
                      No uploaded files available for this guest.
                    </Typography>
                  </div>
                )}
              </div>
            );
          })}
        </Box>

        {/* Print Styles */}
        <style>
          {`
          @media print {
            @page {
              size: auto;
              margin: 5mm;
            }
            
            body {
              -webkit-print-color-adjust: exact;
            }
            
            thead tr {
              background-color: #2d3748 !important;
              color: white !important;
            }

            .guest-details-page {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .guest-photo-page {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-top: 12mm;
            }

            .guest-section {
              margin-top: 8mm;
            }
            
            tr:nth-child(even) {
              background-color: #f7fafc !important;
            }
          }
        `}
        </style>
      </div>
    );
  },
);

export default PrintableGuestTable;
