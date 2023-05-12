import { Button, Col, Divider, Modal, notification, QRCode, Row, Select, Switch, Typography } from 'antd';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import '../CustomModal.scss';
import { DownloadOutlined } from '@ant-design/icons';
import { download, extractErrorMsg } from '@/utils/ServiceUtils';
import { AxiosError } from 'axios';
import { NodesService } from '@/services/NodesService';
import { ExternalClient } from '@/models/ExternalClient';

interface ClientDetailsModalProps {
  isOpen: boolean;
  client: ExternalClient;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  onUpdateClient: (newClient: ExternalClient) => void;
}

export default function ClientDetailsModal({ client, isOpen, onCancel, onUpdateClient }: ClientDetailsModalProps) {
  const [notify, notifyCtx] = notification.useNotification();

  const [qrCode, setQrCode] = useState(' '); // hack to allow qr code display

  const downloadClientData = async () => {
    const qrData = (await NodesService.getExternalClientConfig(client.clientid, client.network, 'file')).data;
    download(`${client.clientid}-${client.network}-netmaker-client.conf`, qrData);
  };

  const loadQrCode = useCallback(async () => {
    try {
      const qrData = (await NodesService.getExternalClientConfig(client.clientid, client.network, 'qr')).data;
      setQrCode(qrData);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to dowloadable client config',
          description: extractErrorMsg(err),
        });
      }
    }
  }, [client, notify]);

  const toggleClientStatus = useCallback(
    async (newStatus: boolean) => {
      Modal.confirm({
        title: `Are you sure you want to ${newStatus ? 'enable' : 'disable'} client ${client.clientid}?`,
        content: `Client ${client.clientid} will be ${newStatus ? 'enabled' : 'disabled'}.`,
        onOk: async () => {
          try {
            const newClient = (
              await NodesService.updateExternalClient(client.clientid, client.network, {
                ...client,
                clientid: client.clientid,
                enabled: newStatus,
              })
            ).data;
            onUpdateClient(newClient);
          } catch (err) {
            notify.error({
              message: 'Failed to update client',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [client, notify, onUpdateClient]
  );

  useEffect(() => {
    loadQrCode();
  }, [loadQrCode]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Client Information</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      centered
      className="CustomModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Row>
          <Col xs={8}>
            <Typography.Text>ID</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{client.clientid}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row>
          <Col xs={8}>
            <Typography.Text>Allowed IPs</Typography.Text>
          </Col>
          <Col xs={16}>
            <Select
              key={client.clientid}
              mode="multiple"
              disabled
              placeholder="Allowed IPs"
              defaultValue={[client.address, client.address6]}
            />
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row>
          <Col xs={8}>
            <Typography.Text>Public key</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text copyable>{client.publickey}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row>
          <Col xs={8}>
            <Typography.Text>Client DNS</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text copyable>{client.dns}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row>
          <Col xs={8}>
            <Typography.Text>Status</Typography.Text>
          </Col>
          <Col xs={16}>
            <Switch checked={client.enabled} onChange={(checked) => toggleClientStatus(checked)} />
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row>
          <Col xs={24}>
            <QRCode
              status={qrCode === ' ' ? 'loading' : 'active'}
              value={qrCode}
              icon="https://github.com/gravitl/netmaker/blob/netmaker_logos/img/logos/N_Teal.png?raw=true"
            />
          </Col>
        </Row>
        <Row style={{ marginTop: '1rem' }}>
          <Col xs={24}>
            <Button onClick={downloadClientData}>
              <DownloadOutlined /> Download config
            </Button>
          </Col>
        </Row>
      </div>

      {/* misc */}
      {notifyCtx}
    </Modal>
  );
}
