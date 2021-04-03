import axios from 'axios'

axios
	.post('http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx?wsdl', {
		nCdEmpresa: '',
		sDsSenha: '',
		nCdServico: '0414,04510',
		sCepOrigem: '22250040',
		sCepDestino: '',
		//Não pode ter hífen
		//Peso em kg
		nVlPeso: '',
		nCdFormato: 1,
		//1 – Formato caixa/pacote
		//2 – Formato rolo/prisma
		//3 – Envelope
		nVlComprimento: 50,
		nVlAltura: 20,
		nVlLargura: 30,
		nVlDiametro: 10,
		sCdMaoPropria: 'N',
		nVlValorDeclarado: 0,
		sCdAvisoRecebimento: 'S',
	})
	.then(function (response) {
		console.log(response)
	})
	.catch(error => {
		console.error(error)
	})