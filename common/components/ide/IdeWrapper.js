import React from 'react';

import Ide from './Ide';
import SourceboxProject from '../../models/project/sourceboxProject';
import { usageConsole } from '../../util/usageLogger';
import { MessageListModel } from '../../models/messages';
import { API } from '../../services';

export default class IdeWrapper extends React.Component {
    constructor(props) {
        super(props);
        
        this.onClick = this.onClick.bind(this);
        
        this.state = {
            codeData: null,
            isDownloading: false
        };
    }

    onClick(e) {
        this.setState({
            codeData: null,
            isDownloading: true
        })
        API.embed.getEmbed({id: this.props.codeID}).then(data => {
            this.setState({
                codeData: data
            });
        }).catch(err => {
            console.log(err);
        });
    }

    renderIdeWrapper() {
        let toRender;
        if(!this.state.codeData) {
            let image = (!this.state.isDownloading) ? "/public/img/download.png" : "/public/img/reload.svg"
            toRender = <div className="container" onClick={this.onClick}>
                <img src={image} />
            </div>;
        } else {
            let messageList = new MessageListModel(usageConsole);
            let projectData = {
                embed: this.state.codeData.INITIAL_DATA,
                user: this.state.codeData.USER_DATA,
                messageList: messageList,
                communication: {
                    jwt: this.state.codeData.websocket.authToken,
                    url: this.state.codeData.websocket.server
                }
            };
            
            // TODO add skulp support
            let project = new SourceboxProject(projectData, {
                auth: this.state.codeData.sourcebox.authToken,
                server: this.state.codeData.sourcebox.server,
                transports: this.state.codeData.sourcebox.transports || ['websocket']
            });
            
            toRender = <div className="col-xs-12" id="ide-container"><Ide project={project} messageList={messageList}/></div>
        }


        return toRender;
    }

    render() {
        if(!this.state.codeData) {
           require.ensure('/public/js/embed.bundle.js', require => {
           });
        }

        return this.renderIdeWrapper();
    }
}