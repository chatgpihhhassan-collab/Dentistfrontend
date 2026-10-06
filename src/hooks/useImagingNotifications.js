import { useEffect } from 'react';

export const useImagingNotifications = ({ patientId, onNewRadiograph, onFindingsReady, onAnalysisFailed }) => {
  useEffect(() => {
    if (!patientId) return;
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!isLocal) return; // REST API mode on cloud deployment

    let connection = null;
    let isCancelled = false;

    // Dynamically import signalR
    import('@microsoft/signalr')
      .then((signalR) => {
        if (isCancelled) return;

        connection = new signalR.HubConnectionBuilder()
          .withUrl('/hubs/imaging')
          .withAutomaticReconnect()
          .build();

        connection
          .start()
          .then(() => {
            connection.invoke('JoinPatientSession', patientId.toString()).catch(() => {});
          })
          .catch(() => {});

        connection.on('imaging:new', (data) => {
          if (onNewRadiograph) onNewRadiograph(data);
        });

        connection.on('ai:findings_ready', (data) => {
          if (onFindingsReady) onFindingsReady(data);
        });

        connection.on('ai:analysis_failed', (data) => {
          if (onAnalysisFailed) onAnalysisFailed(data);
        });
      })
      .catch((err) => {
        console.warn('SignalR client not available, running in fallback mode:', err.message);
      });

    return () => {
      isCancelled = true;
      if (connection) {
        connection.stop().catch(() => {});
      }
    };
  }, [patientId]);
};
