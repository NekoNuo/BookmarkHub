import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client';
import { Container, Form, Button, Col, Row, InputGroup } from 'react-bootstrap';
import { useForm } from "react-hook-form";
import 'bootstrap/dist/css/bootstrap.min.css';
import './options.css'
import optionsStorage from '../../utils/optionsStorage'
const Popup: React.FC = () => {
    const { register, setValue } = useForm();
    useEffect(() => {
        optionsStorage.syncForm('#formOptions');
    }, [])

    return (
        <Container>
            <Form id='formOptions' name='formOptions'>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('githubToken')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <InputGroup size="sm">
                            <Form.Control name="githubToken" ref={register} type="text" placeholder="github token" size="sm" />
                            <InputGroup.Append>
                                <Button variant="outline-secondary" as="a" target="_blank" href="https://github.com/settings/tokens/new" size="sm">Get Token</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    </Col>
                </Form.Group>

                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('gistID')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Control name="gistID" ref={register} type="text" placeholder="gist ID" size="sm" />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('gistFileName')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Control name="gistFileName" ref={register} type="text" placeholder="gist file name" size="sm" />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>{browser.i18n.getMessage('enableNotifications')}</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="enableNotify"
                            name="enableNotify"
                            ref={register}
                            type="switch"
                        />
                    </Col>
                </Form.Group>

                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>启用多浏览器模式</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="enableMultiBrowser"
                            name="enableMultiBrowser"
                            ref={register}
                            type="switch"
                        />
                        <Form.Text className="text-muted">
                            启用后，不同浏览器的书签将分别存储到不同的Gist文件中（如 bookmarks-chrome.json, bookmarks-firefox.json）
                        </Form.Text>
                    </Col>
                </Form.Group>

                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>使用自定义文件名</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="useCustomFileName"
                            name="useCustomFileName"
                            ref={register}
                            type="switch"
                        />
                        <Form.Text className="text-muted">
                            启用后，多浏览器模式下将使用下方自定义的文件名，而不是自动命名
                        </Form.Text>
                    </Col>
                </Form.Group>

                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>自定义文件名</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Control
                            name="customFileName"
                            ref={register}
                            type="text"
                            placeholder="例如: work, home, personal"
                            size="sm"
                        />
                        <Form.Text className="text-muted">
                            多浏览器模式下，如果启用"使用自定义文件名"，将使用此名称
                        </Form.Text>
                    </Col>
                </Form.Group>

                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>启用定时上传</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Check
                            id="enableAutoSync"
                            name="enableAutoSync"
                            ref={register}
                            type="switch"
                        />
                        <Form.Text className="text-muted">
                            启用后，将按照设定的时间间隔自动上传书签到 Gist
                        </Form.Text>
                    </Col>
                </Form.Group>

                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}>上传间隔</Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <Form.Control
                            as="select"
                            name="autoSyncInterval"
                            ref={register}
                            size="sm"
                        >
                            <option value="15">15 分钟</option>
                            <option value="30">30 分钟</option>
                            <option value="60">1 小时</option>
                            <option value="360">6 小时</option>
                            <option value="720">12 小时</option>
                            <option value="1440">24 小时</option>
                        </Form.Control>
                        <Form.Text className="text-muted">
                            定时上传的时间间隔
                        </Form.Text>
                    </Col>
                </Form.Group>

                <Form.Group as={Row}>
                    <Form.Label column="sm" sm={3} lg={2} xs={3}></Form.Label>
                    <Col sm={9} lg={10} xs={9}>
                        <a href="https://github.com/dudor/BookmarkHub" target="_blank">{browser.i18n.getMessage('help')}</a>
                    </Col>
                </Form.Group>
            </Form>
        </Container >
    )
}


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>,
  );
  