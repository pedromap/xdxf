
var SECTIDS = ["mainsect", "extractdxf"]

/**
 *  Define qual a 'section' visível.
 *  Apenas uma 'section' está visível em cada momento, esta função permite
 *      alternar a visibilidade entre todas as 'section' existentes.
 *  @param {string} p_sectid - A identificação da 'section' a tornar visível, uma das identificações contidas em SECTIDS.
 *  @param {string} opt_pushorreplace_state - "PUSH" ou "REPLACE", o modo como esta alteração é introduzida na 'history' do browser.
*/
function showsect(p_sectid, opt_pushorreplace_state) {

    let wdg = document.getElementById(p_sectid);
    let wdgtemp, li_idstr;
    if (wdg) {

        if (opt_pushorreplace_state == "PUSH") {
            //console.log("pushing:"+ p_sectid);
            history.pushState({ sectid: p_sectid }, p_sectid);

        } else if (opt_pushorreplace_state == "REPLACE") {
            //console.log("replacing:"+ p_sectid);
            history.replaceState({ sectid: p_sectid }, p_sectid);
            //} else {
            //console.log("showsect NOT pushing:"+ p_sectid);
        }

        for (let i = 0; i < SECTIDS.length; i++) {
            
			if (SECTIDS[i] != p_sectid) {

                li_idstr = "li_" + SECTIDS[i];
                
				wdgtemp = document.getElementById(SECTIDS[i]);
                if (wdgtemp) {
                    wdgtemp.style.display = "none";
                    //wdgtemp.style.visibility = "hidden";
                }
                wdgtemp = document.getElementById(li_idstr);
                if (wdgtemp) {
                    wdgtemp.classList.remove("sel");
                }

            }
        }

        wdg.style.display = "block";
		if (MAPCTRL) {
			MAPCTRL.invalidateSize();
		}
		//wdg.style.visibility = "visible";
        li_idstr = "li_" + p_sectid;
        wdg = document.getElementById(li_idstr);
        if (wdg) {
            wdg.classList.add("sel");
        }
    }
}

function form_hibedit_validate() {
	// mecanismo de disabling requireds - disabling submit 
	wdg0 = document.getElementById("send_hibedit_details");		
	wdg1 = document.getElementById("send_hibedit_details_btn");		
	if (wdg0!=null && wdg1!=null) {
		let valid = true, changed = false, chkv, defv;
		const inp_list = wdg0.querySelectorAll("input:not(.inactive)");
		for (let i=0; i<inp_list.length; i++) {
			if (valid && inp_list[i].required && inp_list[i].validity.valueMissing) {
				valid = false;
			}
			if (inp_list[i].type == "text") {
				if (inp_list[i].value != inp_list[i].defaultValue) {
					changed = true;
				}
			} else if (!changed && inp_list[i].type == "checkbox") {
				chkv = parseBool(inp_list[i].checked); 
				defv = parseBool(inp_list[i].defaultValue); 
				if (chkv != defv) {
					changed = true;
				}
			}
		}
		// console.log('### val: '+valid + ' changed:' + changed)
		wdg1.disabled = ! valid || ! changed;
	}
} 

function select_hibedit_schema(p_selobj) {
	if (p_selobj) {
		let selval = getSelOption(p_selobj);
		const selschema_wdgids = [
			"div_list_hecandidates", "div_list_hecandidates_error", 
			"div_list_hecandidates_wait", "send_hibedit_details"
		];
		const wdgs = {};
		const falha = widgetsToDict(selschema_wdgids, 
			function(p_id) {
				MessagesController.setMessage("Seleção de schema - falta o widget:"+p_id, true, true);
			}
			, wdgs);
		if (!falha) {
			wdgs["div_list_hecandidates"].style.display = "none";
			wdgs["div_list_hecandidates_error"].style.display = "none";
			wdgs["send_hibedit_details"].style.display = "none";
			if (selval != "null") {
				wdgs["div_list_hecandidates_wait"].style.display = "block";
				list_hedit_candidates(selval);
			} else {
				wdgs["div_list_hecandidates_wait"].style.display = "none";
			}	
		}
	}
}

function form_hibedit_init() {

	let id_hibedit_schemas = "hibedit_schemas";

	/* **************************************************
	 * Selector SCHEMAS e escolha schema ativo
	 * ************************************************** */
	getData("schemata", "json",
		function (p_this, p_evt) {
			if (p_this.response != null && p_this.response.schemata !== undefined) {
				const wdg = document.getElementById(id_hibedit_schemas);
				if (!p_this.response.schemata) {
					MessagesController.setMessage("Base de dados não está online.", true, true);
					if (wdg) {
						wdg.disabled = true;
					}
				} else {
					if (wdg) {
						wdg.disabled = false;
						let opt;

						opt = document.createElement("option");
						opt.text = "(escolha um schema)";
						opt.value = "null"
						wdg.appendChild(opt);							

						for (let i=0; i<p_this.response.schemata.length; i++) {

							opt = document.createElement("option");
							opt.text = p_this.response.schemata[i];
							opt.value = p_this.response.schemata[i];
							wdg.appendChild(opt);							

						}
					}
				}
			}
		}
	);

	let wdg = document.getElementById(id_hibedit_schemas);
    if (wdg) {
        wdg.addEventListener('change', function (ev) {
			let selobj = ev.target;
			if (selobj) {
				select_hibedit_schema(selobj);
			}
		});
    }
	// **************************************************

	/* **************************************************
	 * Validação preenchimentos, no evento de alteração da cx respetiva
	 * ************************************************** */
	wdg = document.getElementById("send_hibedit_details");		
	if (wdg) {
		const inp_list = document.querySelectorAll("input:not(.inactive)");
		for (let i=0; i<inp_list.length; i++) {
			//console.log("id:"+inp_list[i].id+" req:"+inp_list[i].required+" type:"+inp_list[i].type);
			//if (inp_list[i].required) {
				(function (p_wdg) {
					p_wdg.addEventListener('change', function (ev) {
						form_hibedit_validate();
						ev.stopPropagation();
					});
				})(inp_list[i]);				
			//}
		}
	}	
	// **************************************************

	/* **************************************************
	 * Envio comando de alteração, evento click do respetivo botão
	 * ************************************************** */
	const althib_wdgids = [
		id_hibedit_schemas, "hibedit_details_tema", 
		"hibedit_details_classes", "hibedit_details_viewuser",
		"hibedit_details_edituser", "send_hibedit_details"
	];
	const wdg_he_btn = document.getElementById("send_hibedit_details_btn");
	if (wdg_he_btn) {
		(function (p_wdg, p_wdgids) {
			p_wdg.addEventListener('click', function (ev) {
				const wdgs = {};
				const falha = widgetsToDict(p_wdgids, 
					function(p_id) {
						MessagesController.setMessage("Ação de alterar: falta o widget:"+p_id, true, true);
					}
					, wdgs);
				if (!falha) {
					let schemaval = getSelOption(wdgs[id_hibedit_schemas]);
					let classval = getSelOption(wdgs["hibedit_details_classes"]);
					url = "altphibrido?schema="+schemaval+"&tname="+wdgs["hibedit_details_tema"].value+"&classname="+classval+"&editoruser="+wdgs["hibedit_details_edituser"].value+"&vieweruser="+wdgs["hibedit_details_viewuser"].value;
					getData(url, "json",
						function (p_this, p_evt) {
							if (p_this.response!=null) {
								if (p_this.response.status !== undefined && p_this.response.status == "OK") {
									MessagesController.setMessage("Alteração efetuada", true, false);
									select_hibedit_schema(wdgs[id_hibedit_schemas]);
									// ... wdgs["send_hibedit_details"].style.display = "none";

								} else {
									let msg = "Ação de alterar: erro genérico no servidor";
									if (p_this.response.msg !== undefined && p_this.response.msg.length > 0) {
										msg = p_this.response.msg;
									}
									MessagesController.setMessage(msg, true, true);
								}
							}
						},
						function (p_this, p_evt) {
							MessagesController.setMessage("Ação de alterar: erro no acesso ao servidor", true, true);
						}
					);
				}	
						
			});
		})(wdg_he_btn, althib_wdgids);				
	}
	// **************************************************



}

/**
 * Inicialização geral
 */

 (function () {

	// Adicionar trailing slash caso não exista.
	//   Caso contrário, todos os url tem de ser prefixados com a diretoria virtual da app.
	if (!/\/$/.test(window.location.href)) {
		window.location.href = window.location.href + "/";
	}

    for (let idstrlist, classstrlist , i = 0; i < SECTIDS.length; i++) {
        idstrlist = [ "li_" + SECTIDS[i], "a_" + SECTIDS[i]];
		for (let wdg, j=0; j<idstrlist.length; j++) {
			wdg = document.getElementById(idstrlist[j]);
			//console.log(idstrlist[j], wdg);
			if (wdg) {
				(function (p_wdg, p_sectid) {
					p_wdg.addEventListener('click', function (ev) {
						showsect(p_sectid, "PUSH");
						ev.stopPropagation();
					});
				})(wdg, SECTIDS[i]);	
			}
		}
		classstrlist = ["btn_" + SECTIDS[i], "a_" + SECTIDS[i]];
		for (let wdg, j=0; j<classstrlist.length; j++) {
			wdgs = document.getElementsByClassName(classstrlist[j]);
			//console.log(idstrlist[j], wdg);
			for (let k=0; k<wdgs.length; k++) {
				(function (p_wdg, p_sectid) {
					p_wdg.addEventListener('click', function (ev) {
						showsect(p_sectid, "PUSH");
						ev.stopPropagation();
					});
				})(wdgs[k], SECTIDS[i]);	
			}
		}
    }

	showsect("mainsect", "REPLACE");

    // WebSocket mgmt
	/*
    const ws = new WebSocket("ws://10.10.11.52:8000/ws");
    ws.onmessage = function(event) {
        
        console.log(event.data);
        const data = JSON.parse(event.data);
        
        //logEstado(data, true);
    };
	*/

	
	

 })();

function get_colnames_for_table(p_selschema, p_tname, p_input_wdg) {
	getData("tablecols?schema="+p_selschema+"&tname="+p_tname, "json",
		function (p_this, p_evt) {
			if (p_this.response!=null && p_this.response.cols !== undefined && p_this.response.cols.length > 0) {
				p_input_wdg.value = p_this.response.cols.join(",");
			} else {
				p_input_wdg.value = "";
			}
		},
		function (p_this, p_evt) {
			p_input_wdg.value = "(erro na leitura de colunas)";
		}
	);
}

function get_grantsbasetable(p_selschema, p_tname, p_input_wdg) {
	getData("grants?schema="+p_selschema+"&tname="+p_tname+"&basetable=true", "json",
		function (p_this, p_evt) {
			if (p_this.response!=null && p_this.response.granted_users !== undefined && p_this.response.granted_users.length > 0) {
				p_input_wdg.value = p_this.response.granted_users.join(",");
			} else {
				p_input_wdg.value = "";
			}
		},
		function (p_this, p_evt) {
			p_input_wdg.value = "(erro na leitura de grants na tabela base)";
		}
	);
}

function get_grantsevw(p_selschema, p_tname, p_input_wdg) {
	getData("grants?schema="+p_selschema+"&tname="+p_tname+"&basetable=false", "json",
		function (p_this, p_evt) {
			if (p_this.response!=null && p_this.response.granted_users !== undefined && p_this.response.granted_users.length > 0) {
				p_input_wdg.value = p_this.response.granted_users.join(",");
			} else {
				p_input_wdg.value = "";
			}
		},
		function (p_this, p_evt) {
			p_input_wdg.value = "(erro na leitura de grants na view evw)";
		}
	);
}

function get_errorflags_for_table(p_selschema, p_tname, p_input_wdg) {
	getData("tablerrorflags?schema="+p_selschema+"&tname="+p_tname, "json",
		function (p_this, p_evt) {
			if (p_this.response!=null && p_this.response.error_flags !== undefined && p_this.response.error_flags.length > 0) {
				p_input_wdg.value = p_this.response.error_flags.join(",");
			} else {
				p_input_wdg.value = "";
			}
		},
		function (p_this, p_evt) {
			p_input_wdg.value = "(erro na leitura de flags de erro)";
		}
	);
}

function get_altphibrido_params(p_selschema, p_classes_wdg, p_viewername_wdg, p_editorname_wdg, p_genericgeom_wdg) {
	getData("altphibrido_params?schema="+p_selschema, "json",
		function (p_this, p_evt) {
			removeOptions(p_classes_wdg);
			if (p_this.response!=null) {
				for (let i=0; i<p_this.response.cols_classes.length; i++) {
					opt = document.createElement("option");
					opt.text = p_this.response.cols_classes[i];
					opt.value = p_this.response.cols_classes[i];
					p_classes_wdg.appendChild(opt);							
				}
				if (p_viewername_wdg) {
					p_viewername_wdg.value = p_this.response.viewer;
					p_viewername_wdg.defaultValue = p_this.response.viewer;
				}
				if (p_editorname_wdg) {
					p_editorname_wdg.value = p_this.response.editor;
					p_editorname_wdg.defaultValue = p_this.response.editor;
				}
				if (p_genericgeom_wdg) {
					p_genericgeom_wdg.checked = false;
					p_genericgeom_wdg.defaultValue = false;
				}
			}
		},
		function (p_this, p_evt) {
			console.log("erro na leitura de parâmetros para alteração");
		}
	);
}

function list_hedit_candidates(p_selschema) {

	getData("hedit_candidates?schema="+p_selschema, "json",

		function (p_this, p_evt) {

			const list_edit_wdgids = [
				"div_list_hecandidates", "div_list_hecandidates_error", 
				"div_list_hecandidates_wait", "send_hibedit_details",
				"hibedit_details_tema", "hibedit_details_campos",
				"hibedit_details_grantstb", "hibedit_details_grantsevw",
				"hibedit_details_errflags", "hibedit_details_classes",
				"hibedit_details_viewuser", "hibedit_details_edituser",
				"send_hibedit_details_btn", "hibedit_details_genericgeom"
			];
			const wgds = {};
			const falha = widgetsToDict(list_edit_wdgids, 
				function(p_id) {
					MessagesController.setMessage("Listagem temas -- falta o widget:"+p_id, true, true);
				}
				, wgds);
			if (!falha) {

				wgds["div_list_hecandidates_wait"].style.display = "none";
				wgds["send_hibedit_details"].style.display = "none";
				if (p_this.response!=null && p_this.response.hedit_candidates !== undefined && p_this.response.hedit_candidates.length > 0) {
					wgds["div_list_hecandidates"].style.display = "block";
					wgds["div_list_hecandidates_error"].style.display = "none";

					filltable("table_hecandidates", 
					["Nome tabela", "'Editor track.'", "'Archiving'", "Tipo edição", "Num registos", "Em erro"], 
					p_this.response.hedit_candidates, 
					["nome_tabela", "editortracking_ativo", "archiving_ativo", "tipo_edicao", "num_registos", "em_erro"], 
						null, null, 
					function(p_rowid, p_row) { 
						wgds["send_hibedit_details"].style.display = "block";
						wgds["send_hibedit_details"].scrollIntoView();
						wgds["hibedit_details_tema"].value = p_row.firstChild.textContent;

						get_colnames_for_table(p_selschema, p_row.firstChild.textContent, wgds["hibedit_details_campos"]);
						get_errorflags_for_table(p_selschema, p_row.firstChild.textContent, wgds["hibedit_details_errflags"]);

						get_grantsbasetable(p_selschema, p_row.firstChild.textContent, wgds["hibedit_details_grantstb"]);
						get_grantsevw(p_selschema, p_row.firstChild.textContent, wgds["hibedit_details_grantsevw"]);

						get_altphibrido_params(p_selschema, wgds["hibedit_details_classes"], wgds["hibedit_details_viewuser"], wgds["hibedit_details_edituser"], wgds["hibedit_details_genericgeom"]);

						if (p_row.children[3].textContent == "Híbrida") {
							if (p_row.children[5].textContent == "Sim") {
								wgds["send_hibedit_details_btn"].disabled = false;
								wgds["send_hibedit_details_btn"].textContent = "Corrigir erros";
							} else {
								wgds["send_hibedit_details_btn"].disabled = true;
								wgds["send_hibedit_details_btn"].textContent = "Alterar";
							}
						} else {
							wgds["send_hibedit_details_btn"].disabled = false;
							wgds["send_hibedit_details_btn"].textContent = "Alterar para edição híbrida";
						}						
					});
				} else {
					wgds["send_hibedit_details"].style.display = "none";
					wgds["hibedit_details_tema"].style.display = "block";
				}
			}
		},

		function (p_this, p_evt) {
			let wdg0 = document.getElementById("div_list_hecandidates");
			let wdg1 = document.getElementById("div_list_hecandidates_error");
			let wdg2 = document.getElementById("div_list_hecandidates_wait");
			MessagesController.setMessage( "Impossível obter listagem de tabelas.", true, true);
			if (wdg0) {
				wdg0.style.display = "none";
			}
			if (wdg1) {
				wdg1.style.display = "block";
			}
			if (wdg2) {
				wdg2.style.display = "none";
			}

		}
	);

}


class GestorRetangulo {
	constructor() {
		this.pA = null;
		this.pB = null;
		this.cnt = 0;
		this.bounds = null;
		this.boundingBox = null;
	}
	desenha() {
		this.bounds = [this.pA, this.pB];
		console.log('a', this.bounds)
		
		if (this.boundingBox != null) {
        MAPCTRL.removeLayer(this.boundingBox);
		console.log('apagar')
    }

		// create an orange rectangle
		this.boundingBox = L.rectangle(this.bounds, {color: "#ff7800", weight: 3});
		console.log('a', this.boundingBox)
		console.log ('b',this.boundingBox)
		MAPCTRL.addLayer(this.boundingBox);	
		console.log ('b',this.boundingBox)	;
	}
	click(evt) {
		this.cnt = this.cnt + 1;

		if (this.cnt % 2 == 0) {
			this.pB = [evt.latlng.lat, evt.latlng.lng];
		} else {
			this.pA = [evt.latlng.lat, evt.latlng.lng];
		}
		
		if (this.cnt == 2) {
			this.cnt = 0;
			this.desenha();
			this.pA = null;
			this.pB = null;			
		}
		
	}
}
