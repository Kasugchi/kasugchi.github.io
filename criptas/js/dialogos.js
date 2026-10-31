// =============================================================
//  DIÁLOGOS NUEVOS DE LOS VECINOS (escritos por Argón con el encargo
//  encargo-dialogos). pueblo.html los suma a los que ya trae VEC:
//    vecinos[id].saludo[momento] → varios saludos por momento (sale uno al azar)
//    vecinos[id].charla / .amigo → frases que se añaden al montón
//    conversaciones → [{ a, b, lineas }] charlas entre dos vecinos
//    genericas      → [pregunta, respuesta] para cualquier pareja
//  Para añadir más: pega aquí; {N} es el nombre del jugador.
// =============================================================
export const NUEVOS = {
 "vecinos": {
  "pip": {
   "saludo": {
    "manana": [
     "¡Arriba, {N}! He intentado saltar a la pata coja hasta el río. Casi lo consigo.",
     "¡Buenos días! Hoy tengo una energía que ni diez trasgos juntos.",
     "¡Mira qué sol! Es el día perfecto para buscar tesoros o mi calcetín."
    ],
    "tarde": [
     "¡Por fin vuelves, {N}! Cuéntame cosas del libro mientras merendamos.",
     "¡Hola! Estaba espiando a las hormigas de la plaza. Tienen prisa.",
     "¡Buenas tardes! He visto una nube con forma de bota. Era enorme."
    ],
    "noche": [
     "¡Psst, {N}! Si no hago ruido dicen que no me ven para ir a dormir.",
     "Buenas noches... Hoy el cielo parece una cueva llena de antorchas.",
     "No tengo sueño, de verdad. Mis ojos solo están descansando un poco."
    ]
   },
   "charla": [
    "Ayer até una cuerda a un nabo de Bartolomé. Pensé que saldría volando.",
    "Dicen que en el fondo del río brillan cosas. Seguro que son monedas.",
    "Le he pedido a Mordo que me forje una bota de hierro. Pesa mucho.",
    "Doña Escarcha me dio una galleta azul. Ahora salto un palmo más alto.",
    "Rufo me enseñó un insulto pirata, pero se me ha olvidado la mitad.",
    "A veces Morrandar se rasca contra las rocas y se mueve hasta el banco.",
    "Si encuentro una espada de madera en el libro, ¿me la regalas, {N}?",
    "El gato Tintero se sentó en mi mapa secreto. Ahora es su alfombra."
   ],
   "amigo": [
    "Toma, {N}, he guardado esta piedra brillante para ti. Da buena suerte.",
    "Siempre que bajas al libro me quedo cerca de la entrada esperando verte.",
    "Eres mi persona favorita de todo Morrandar. ¡Y he conocido a muchas!"
   ]
  },
  "hiel": {
   "saludo": {
    "manana": [
     "Abre bien los ojos, {N}. El aire fresco despeja la mente y los bolsillos.",
     "Buenos días. Espero que vengas a ingresar y no a retirar.",
     "El sol calienta las tejas y a mí las cuentas. Día de balance."
    ],
    "tarde": [
     "Llegas justo a tiempo para ver cómo cierro la caja fuerte.",
     "Buenas tardes, {N}. Traes polvo en las botas y espero que oro en mano.",
     "Adelante. Si no tocas los archivadores nos llevaremos estupendamente."
    ],
    "noche": [
     "Cierro el libro mayor. Para ti siempre queda un minuto, pero solo uno.",
     "Las noches sobre Morrandar son frías. Abrígate antes de salir.",
     "¿Aún despierto? Las mejores fortunas se forjan de día, muchacho."
    ]
   },
   "charla": [
    "El truco de un buen botín no es conseguirlo, sino que nadie sepa dónde está.",
    "Mordo me debe tres pagarés. Dice que el metal está caro. Excusas.",
    "Brumas vino preguntando por la tarta. Le mostré mi libro de balances.",
    "Si Morrandar da un bandazo, las monedas tintinean. Mi música favorita.",
    "Ese aprendiz de pirata, Rufo, sujeta el sable al revés. Qué calamidad.",
    "Las cerraduras de mi cámara no las abre ni un trasgo con dinamita.",
    "Tener el dinero bajo el colchón solo sirve para dormir con tortícolis.",
    "Escarcha dice que el oro no da la felicidad. Tampoco la dan sus galletas."
   ],
   "amigo": [
    "Toma esta moneda antigua. La gané en mi primer abordaje. Guárdala bien.",
    "Si algún día me falta fuelle, prométeme que no dejarás a Pip descalzo.",
    "No tengo familia en estas páginas, {N}, pero verte regresar me basta."
   ]
  },
  "mordo": {
   "saludo": {
    "manana": [
     "El fuelle ya echa chispas. Si buscas acero templado, este es el sitio.",
     "Buenas mañanas. El yunque suena mejor cuando aún no hay quejas.",
     "¿En pie tan pronto, {N}? Los que madrugan rompen menos armaduras."
    ],
    "tarde": [
     "Pasa y no toques los clavos calientes. Aún huelen a carbón nuevo.",
     "¿Qué traes de las mazmorras? Siempre hay hueco en mi desván.",
     "Aquí me tienes, enderezando bisagras. Un trabajo honrado y pesado."
    ],
    "noche": [
     "El fuego del horno ilumina media calle. Mejor que las farolas.",
     "¿Caminando a estas horas? Cuidado con los hierros del suelo.",
     "Buenas noches, {N}. Cierro el taller, pero el negocio sigue abierto."
    ],
    "madrugada": [
     "El carbón de encina dura toda la noche. Da gusto forjar a oscuras.",
     "Si vienes por clavos a las tres de la mañana, cobro el doble.",
     "Silencio absoluto, salvo por el martillo. Así da gusto trabajar."
    ]
   },
   "charla": [
    "Esa armadura que llevas cruje más que el caparazón de Morrandar.",
    "Las ranas gordas se esconden tras el molino. Escarcha paga dos piezas.",
    "Sir Bartolomé me pidió una cota de malla que rimara. Le di una sartén.",
    "Un trasgo me mordió el zapato una vez. El pobre se rompió dos colmillos.",
    "Si limpias el óxido con zumo de limón, brilla. Pero huele a ensalada.",
    "La Guía Ciega me dijo dónde encontrar cobre fino. Y acertó de pleno.",
    "Pip quería herraduras para su bota solitaria. Casi le hago caso.",
    "No confío en las espadas que brillan. Prefiero las pesadas y fiables."
   ],
   "amigo": [
    "He templado este pomo con ceniza de roble. No se romperá nunca, ten.",
    "Pocos aguantan mi mal genio en este pueblo. Tú te has ganado el sitio.",
    "Si alguna vez necesitas que te cubra las espaldas, avisa al tuerto."
   ]
  },
  "anzuelo": {
   "saludo": {
    "manana": [
     "La niebla sobre el agua trae letras claras. Buen día para pescar.",
     "Hola, {N}. El corcho ha bailado dos veces, señal de buena marea.",
     "El sol despunta en el lomo de Morrandar. Respira hondo ese aire."
    ],
    "tarde": [
     "Pasa, muchacho. El río fluye manso y las páginas flotan sin prisa.",
     "Buenas tardes. Traigo un hilo nuevo de seda que no asusta al papel.",
     "Mira la corriente, {N}. A veces pasa un párrafo entero en verso."
    ]
   },
   "charla": [
    "Pesqué a Madre Hiel en una esquina rota. Traía el cofre bien agarrado.",
    "Hay días en que solo salen signos de puntuación. Comas y puntos.",
    "Morrandar sabe cuándo lanzo el anzuelo y frena un poco la marcha.",
    "Las palabras escritas con tinta azul pesan más y se van al fondo.",
    "Doña Escarcha vino flotando entre dos hojas de recetas encantadas.",
    "Si ves una metáfora flotando en el agua, déjala; pican muy hondo.",
    "Brumas me preguntó si pesqué una tarta. La tinta no sabe a fresa.",
    "Este muelle de madera vieja tiene más historias que todo el libro."
   ],
   "amigo": [
    "He dejado un párrafo en blanco en mi diario de pesca. Lleva tu nombre.",
    "Verte volver del libro me alegra tanto como sacar un capítulo feliz.",
    "Si alguna vez te sientes perdido, ven aquí. El agua aclara las ideas."
   ]
  },
  "guia": {
   "charla": [
    "El viento de poniente trae olor a ceniza vieja. Alguien cerró un tomo.",
    "No busques la salida con prisa; las puertas se abren hacia adentro.",
    "Lumi pinta con tonos que la gente ha olvidado nombrar. Qué regalo.",
    "Bajo las raíces de los nabos de Bartolomé duerme un eco muy antiguo.",
    "Las monedas de Hiel tintinean como campanas lejanas. Avisan lluvia.",
    "Morrandar no camina por el mundo; el mundo se desliza bajo sus patas.",
    "En el libro hay sombras que solo quieren que alguien lea su nombre.",
    "Escucho el roce de tus botas, {N}. Hoy caminas con paso certero."
   ],
   "amigo": [
    "Veo tu hilo de tinta entrelazado con este pueblo. Ya no se romperá.",
    "Cuando cierres los ojos en la mazmorra, recuerda este mirador. Estaré.",
    "Eres el compás que le faltaba a esta melodía sin principio, {N}."
   ]
  },
  "rufo": {
   "saludo": {
    "manana": [
     "¡En guardia, {N}! El viento huele a salitre y a desayuno pirata.",
     "¡Buenos días! Hoy no me he mareado ni una vez al bajar de la cama.",
     "¡Ah del barco! Bueno, de la tortuga. ¡Salud, camarada de fatigas!"
    ],
    "tarde": [
     "¡Buenas tardes! Estaba afilando mi sable de madera contra una farola.",
     "¡Eh, {N}! ¿Peleamos? «¡Tienes la pegada de un calamar dormido!». ¿Qué tal?",
     "Llegas justo para mi lección de nudos marineros. Ya me he atado solo."
    ],
    "noche": [
     "¡Noche cerrada en alta mar! O en la plaza, que se le parece mucho.",
     "Las estrellas guían mi rumbo... hacia la cantina a por agua fresca.",
     "¡Al abordaje nocturno! Sin pisar los nabos de Bartolomé, que grita."
    ],
    "madrugada": [
     "A estas horas patrullo la cubierta. Morrandar no duerme y yo casi.",
     "¡Por las barbas de Neptuno! Qué susto me has dado en la penumbra.",
     "Estoy practicando mi mirada fiera frente al espejo del herrero."
    ]
   },
   "charla": [
    "Le dije a Mordo: «¡Cara de trucha!». Casi me tira un martillo de diez kilos.",
    "Si me como dos galletas de Escarcha, ¿aprendo a ver en la niebla?",
    "Pip quiere ser mi grumete, pero exige cobrar tres galletas por hora.",
    "Una ola del río me salpicó la oreja. Casi naufrago en la orilla.",
    "El capitán Barbaescoba tenía un loro. Yo tengo una mosca que me sigue.",
    "Tengo un mapa secreto de Morrandar: la X marca la despensa de Marga.",
    "El parche en el ojo me mola, pero a veces me choco contra los postes.",
    "Dicen que los esqueletos del libro no saben nadar. ¡Punto para mí!"
   ],
   "amigo": [
    "Si alguna vez consigo un galeón de verdad, tú serás mi primer oficial.",
    "Toma mi doblón de latón de la suerte. Solo se lo daría a mi mejor amigo.",
    "Contigo al lado, {N}, ni los calamares gigantes me dan nada de miedo."
   ]
  },
  "bartolome": {
   "saludo": {
    "manana": [
     "Despierta la aurora con lumbre dorada, / y yo ya paseo con paso y espada.",
     "¡Salud, {N}! La mañana ya brilla, / y mi azada reluce sin mancilla.",
     "El sol matinal calienta el sendero, / ¡saludo con garbo a mi compañero!"
    ],
    "tarde": [
     "La tarde declina con lento fulgor, / y yo sigo aquí con noble labor.",
     "¡Hermosa jornada tenéis a bien dar, / sobre esta tortuga cruzando la mar!",
     "Venid a mi lado, valiente adalid, / y descansad presto tras vuestra gran lid."
    ]
   },
   "charla": [
    "Mis nabos redondos no temen al frío, / crecen con garbo mirando hacia el río.",
    "Escuché un «¡quiquiriquí!» en el tejado, / y me quedé tieso de puro pasmado.",
    "El pícaro Rufo carece de rima, / mas yo con mis versos lo dejo en la cima.",
    "Mordo el herrero forjó esta azadilla, / que arranca las malas hierbas de rodillas.",
    "La dama Escarcha prepara una sopa, / que cambia de color la tela y la ropa.",
    "El noble Morrandar avanza despacio, / su verde caparazón es nuestro palacio.",
    "Si halláis en el libro una flor encendida, / traedla al huerto a alegrarme la vida.",
    "Pip corrió veloz perdiendo el calzado, / saltando los surcos que yo hube labrado."
   ],
   "amigo": [
    "Versos de honor yo compongo en secreto, / para cantar vuestro valor por completo.",
    "Vuestra hidalguía conmueve mi pecho, / teneros por amigo es noble provecho.",
    "Si un gallo feroz viniera a mi encuentro, / sé bien que {N} se pondría en el centro."
   ]
  },
  "escarcha": {
   "saludo": {
    "manana": [
     "Buenos días, cielo. El caldero ya hierve con menta y un poquito de sal.",
     "¡Vaya energía, {N}! A estas horas mi escoba barre sola por inercia.",
     "Madrugar arruga la piel, pero mira qué sol tan mono sobre la plaza."
    ],
    "tarde": [
     "Pasa, encanto. La hornada de las tres tiene chispas de anís muy ricas.",
     "¡Ay, {N}! Justo pensaba en ti mientras removía la mermelada.",
     "Buenas tardes. Si oyes ruidos en la despensa, es solo levadura mágica."
    ],
    "noche": [
     "La brisa nocturna agita los sauces. Hora de repasar los conjuros viejos.",
     "Buenas noches, alma cándida. Ten cuidado con los gatos en la sombra.",
     "¿Paseando a oscuras? No te acerques mucho al huerto, hay ortigas vivas."
    ],
    "madrugada": [
     "A las cuatro de la mañana las estrellas susurran los mejores chismes.",
     "¿Tú tampoco pegas ojo? La tila con canela hace milagros, pruébala.",
     "Shhh, no hagas ruido, que estoy secando raíces de nabo lunar."
    ]
   },
   "charla": [
    "Madre Hiel tiene un corazón de oro, aunque lo guarde con tres cerrojos.",
    "Le di una galleta a Sir Bartolomé y rimó durante cuatro horas seguidas.",
    "La tarta de Marga no desapareció sola; tenía unas cerezas deliciosas.",
    "Pip cree que no le veo esconderse en mi tonel. Asoma su bota solitaria.",
    "El Viejo Anzuelo me pescó con un anzuelo de plata. Casi le muerdo.",
    "Mordo me trajo una rana con manchas rojas. Es monísima, se llama Berta.",
    "Brumas cree que usa gabardina de incógnito; cruje como el papel seco.",
    "Lumi me ayuda a buscar tréboles. Sus deditos hacen brotar el color."
   ],
   "amigo": [
    "Esta receta de galletas es solo para ti: prometo que no tiene magia rara.",
    "En mis años oscuros nadie me sonreía. Verte venir me alegra el día, {N}.",
    "Si algún hechizo te sale al revés en el libro, ven a mí. Lo arreglaremos."
   ]
  },
  "brumas": {
   "saludo": {
    "noche": [
     "(voz en off) El reloj dio las diez. Un callejón oscuro y los pasos de {N}.",
     "(voz en off) Niebla espesa sobre Morrandar. Solo los duros salían a pasear.",
     "Buenas noches, {N}. Su gabardina no hace ruido; buena señal para investigar."
    ],
    "madrugada": [
     "(voz en off) Las cuatro en punto. Hora de atar cabos o tropezar con ellos.",
     "(voz en off) La farola parpadeaba como un testigo nervioso. Y ahí llegó {N}.",
     "La noche es fría, muchacho. Los secretos no duermen y yo tampoco."
    ]
   },
   "charla": [
    "(voz en off) El caparazón de Morrandar vibraba. Las tortugas guardan silencio.",
    "Encontré una miga sospechosa junto al banco de Hiel. Caso en desarrollo.",
    "(voz en off) Sir Bartolomé rima todo lo que ve. Sospecho que oculta una pista.",
    "El gato Tintero estuvo en la escena del crimen. Su coartada: una siesta.",
    "(voz en off) La lluvia borraba las huellas, salvo la huella de una sola bota.",
    "Rufo me ofreció grog para brindar. Rechacé; nubla el olfato policial.",
    "(voz en off) Escarcha hornea galletas a medianoche. La harina deja marcas.",
    "Si alguien sabe quién escribió mi última página, que no me lo diga aún."
   ],
   "amigo": [
    "(voz en off) En esta ciudad de papel, {N} era la única pista que no fallaba.",
    "Le confiaría mi libreta de notas, muchacho. Y eso no se lo digo a nadie.",
    "(voz en off) Había encontrado un socio de fiar bajo la luna de Morrandar."
   ]
  },
  "lumi": {
   "saludo": {
    "manana": [
     "¡Buenos días, {N}! El cielo tiene un color celeste que da ganas de pintar.",
     "¡Hola! Las flores del huerto se han despertado con un amarillo precioso.",
     "¡Mira qué brillo! Hoy el agua del río parece un espejo de acuarela."
    ],
    "tarde": [
     "¡Hola, {N}! He encontrado una piedrita que tiene tres tonos de gris.",
     "¡Buenas tardes! Estaba dibujando a Morrandar con tiza verde en el suelo.",
     "¡Qué alegría verte! El sol de la tarde pinta todo de naranja suave."
    ]
   },
   "charla": [
    "Cuando llegué del libro era casi blanca y negra. Ahora tengo mejillas rosas.",
    "A veces toco una hoja marchita y le vuelve una pizca de verde.",
    "Doña Escarcha me regaló un tarro con purpurina dorada. Brilla mucho.",
    "Pip me ayudó a buscar flores rojas, pero se distrajo persiguiendo un pato.",
    "El señor Bartolomé me dejó pintar una rima con tiza violeta en su valla.",
    "Si Morrandar pasa cerca de un arcoíris, ¿crees que se le pintará el lomo?",
    "El gatito Tintero tiene el pelo del negro más brillante que he visto.",
    "En las mazmorras del libro hay piedras oscuras, pero aquí todo se ilumina."
   ],
   "amigo": [
    "He dibujado a {N} en una página limpia con todos mis lápices favoritos.",
    "Cuando estás aquí, el pueblo parece pintado con los colores más alegres.",
    "Toma esta margarita de pétalos brillantes; la guardé para dártela a ti."
   ]
  },
  "gato": {
   "charla": [
    "Se sube al banco de Madre Hiel y bosteza enseñando unos colmillos blancos.",
    "Miau… Miau.",
    "Persigue una brizna de hierba levantada por el viento y da un salto cómico.",
    "Prrr... prrr... Ronronea tan fuerte que parece un motor diminuto.",
    "Se sienta sobre una bota vieja abandonada y no tiene intención de moverse.",
    "Mira fijamente hacia el mirador como si viera algo flotando en el aire.",
    "Te huele la punta de la bota, estornuda una vez y se sienta a lavarse.",
    "Se tumba boca arriba en un charco de sol caliente sobre las maderas."
   ],
   "amigo": [
    "Apoya su cabeza suavemente en tu mano y cierra los ojos despacito.",
    "Prrr... Te sigue tres pasos, se sienta sobre tu pie y te mira con cariño.",
    "Deja caer una pequeña pluma azul a tus pies y emite un maullido dulce."
   ]
  },
  "marga": {
   "saludo": {
    "manana": [
     "¡Arriba ese ánimo, {N}! Hay pan crujiente y mermelada recién hecha.",
     "Buenos días, corazón. Una taza bien caliente para empezar con fuerza.",
     "El sol asoma por la barra. Tómate algo antes de que empiece el trajín."
    ],
    "tarde": [
     "¡Pasa al fondo, {N}! La sopa del mediodía ha salido para chuparse los dedos.",
     "Buenas tardes. Descansa los pies un rato, que el suelo está fresquito.",
     "Entra, entra. Tengo una jarra de infusión fría que te va a revivir."
    ],
    "noche": [
     "Buenas noches, viajero. La lumbre sigue encendida y el guiso caliente.",
     "Pasa y siéntate junto a la chimenea. La noche fuera viene helada.",
     "¡Qué alegría verte a estas horas! Te pongo un plato reconfortante."
    ],
    "madrugada": [
     "A estas horas el café se sirve en silencio. Tómate una taza con calma.",
     "¿Noche dura en las páginas? Siéntate; la cocina nunca se apaga.",
     "La madrugada es para descansar el alma. Come algo caliente, anda."
    ]
   },
   "charla": [
    "Pip intentó cambiarme una manzana mordida por un pastel entero. Qué lince.",
    "Madre Hiel baja a desayunar puntual como un reloj de cuco. Sin falta.",
    "Mordo pide siempre una taza extra grande para calentar sus manazas.",
    "El inspector mira cada miga con lupa. Me da una risa que casi me delato.",
    "Sir Bartolomé me pidió una empanada rimando cinco estrofas. Se le enfrió.",
    "A veces Morrandar se sumerge un palmo y los platos tintinean solos.",
    "Escarcha me ofreció levadura especial. Le dije que aprecio mi cocina viva.",
    "El Anzuelo me contó que pescó la mesa de mi rincón en un libro de viajes."
   ],
   "amigo": [
    "Esta tarta de manzana la he guardado en el horno solo para ti, {N}.",
    "En esta cantina siempre tendrás una silla reservada y plato caliente.",
    "Tener clientes es mi trabajo, pero tener amigos como tú es mi suerte."
   ]
  }
 },
 "conversaciones": [
  {
   "a": "pip",
   "b": "mordo",
   "lineas": [
    "¡Mordo! ¿Me haces una espada de hierro que brille mucho?",
    "Primero aprende a no perder tus botas, renacuajo.",
    "¡Es que una espada ayuda a encontrar botas perdidas!"
   ]
  },
  {
   "a": "escarcha",
   "b": "bartolome",
   "lineas": [
    "Caballero, pruebe esta galleta de anís y romero.",
    "Temo a vuestro manjar, señora de la magia, / que altera mi salud y causa vil neuralgia.",
    "¡Qué exagerado! Solo le saldrían un par de plumas en el sombrero."
   ]
  },
  {
   "a": "hiel",
   "b": "rufo",
   "lineas": [
    "Niño, ¿cuántas monedas llevas ahorradas en tu saco?",
    "¡Los corsarios no ahorramos, gastamos todo en pertrechos!",
    "Por eso los corsarios viejos acaban durmiendo bajo el muelle."
   ]
  },
  {
   "a": "brumas",
   "b": "escarcha",
   "lineas": [
    "(voz en off) El olor a canela delataba a la sospechosa.",
    "Inspector, deje de narrar y tómese un bollo, que le sienta mal la noche.",
    "Un detective en servicio nunca acepta sobornos con azúcar glas."
   ]
  },
  {
   "a": "anzuelo",
   "b": "lumi",
   "lineas": [
    "Hoy he pescado una hoja con un dibujo de flores muy raras.",
    "¡Déjame verla! Seguro que les falta un poco de color violeta.",
    "Toda tuya, pequeña. Haz que broten bien bonitas."
   ]
  },
  {
   "a": "guia",
   "b": "pip",
   "lineas": [
    "El viento dice que hoy pisas con un pie más ligero que el otro.",
    "¡Es que sigo con una sola bota! ¿Morrandar sabe dónde está?",
    "Morrandar siente tus pasitos y se ríe bajito bajo la tierra."
   ]
  },
  {
   "a": "mordo",
   "b": "hiel",
   "lineas": [
    "Hiel, necesito extender el pagaré del carbón hasta el viernes.",
    "El carbón quema hoy y las deudas queman siempre. Tráeme intereses.",
    "Te traeré tres bisagras de bronce pulido y quedamos en paz."
   ]
  },
  {
   "a": "brumas",
   "b": "rufo",
   "lineas": [
    "(voz en off) El joven aspirante a bribón merodeaba sin rumbo fijo.",
    "¡No merodeo, patrullo mi cubierta! ¿Quieres batirte en duelo?",
    "Solo me bato con la verdad, muchacho. Y suele doler más que un sable."
   ]
  },
  {
   "a": "bartolome",
   "b": "lumi",
   "lineas": [
    "Dulcísima niña que pinta las flores, / colmáis este suelo de vivos colores.",
    "¡He pintado una flor amarilla en tu armadura para que no se oxide!",
    "Llevaré vuestro nardo con noble altivez, / brillando en mi pecho una y otra vez."
   ]
  },
  {
   "a": "anzuelo",
   "b": "mordo",
   "lineas": [
    "Mordo, el anzuelo grande se me dobló con un tomo pesado.",
    "Te dije que no pescaras diccionarios. Tráelo y lo pongo al rojo."
   ]
  },
  {
   "a": "guia",
   "b": "bartolome",
   "lineas": [
    "Tus pasos resuenan a hierro y a miedo con plumas.",
    "Si un gallo cantare en la cuesta empinada, / mi lanza de nabo sería quebrada.",
    "Tranquilo, caballero. Solo es la brisa entre los sauces."
   ]
  },
  {
   "a": "brumas",
   "b": "mordo",
   "lineas": [
    "Herrero, ¿dónde estuvo entre las dos y las tres de la madrugada?",
    "Cazando ranas para Escarcha en el río. Pregúntale a los sapos.",
    "(voz en off) Su coartada era viscosa, pero encajaba con el fango."
   ]
  },
  {
   "a": "pip",
   "b": "lumi",
   "lineas": [
    "¡Lumi! Si pintas mi pie descalzo de negro, ¿parecerá una bota?",
    "¡Se te va a manchar con el barro y quedará todo marrón!",
    "Vaya... Entonces mejor ayúdame a buscarla detrás del molino."
   ]
  },
  {
   "a": "anzuelo",
   "b": "escarcha",
   "lineas": [
    "Ayer saqué del agua un pergamino que chisporroteaba, vecina.",
    "¡Vaya por Dios! Era mi lista de la compra encantada. Tráela acá."
   ]
  },
  {
   "a": "brumas",
   "b": "hiel",
   "lineas": [
    "(voz en off) La banquera contaba monedas en la penumbra. Parecía impasible.",
    "Inspector, si no va a abrir una cuenta, deje de mirar la caja fuerte.",
    "Solo busco huellas sospechosas, señora. La tarta sigue sin aparecer."
   ]
  }
 ],
 "genericas": [
  [
   "¿Sentiste ese temblor esta mañana?",
   "Sí, Morrandar se estaba rascando con una roca marina."
  ],
  [
   "Dicen que en el libro hay pasillos enteros de cristal.",
   "Yo no bajo ni loco; me dan miedo las alturas y los trasgos."
  ],
  [
   "Huele a pan recién horneado por toda la plaza.",
   "Marga lleva desde el alba con el horno a tope."
  ],
  [
   "¿Has probado las nuevas galletas del pueblo?",
   "Me da miedo que me salgan escamas o me ponga a croar."
  ],
  [
   "¿Viste salir a {N} hacia las mazmorras?",
   "Iba con paso firme. Seguro que vuelve con buen botín."
  ],
  [
   "El río baja hoy con mucha espuma blanca.",
   "El Viejo Anzuelo dice que pican páginas de libros de tormentas."
  ],
  [
   "Pip sigue saltando por ahí a la pata coja.",
   "A este paso se le va a gastar el único calcetín que le queda."
  ],
  [
   "Esta noche se oían martillazos en la herrería.",
   "Mordo no duerme cuando el metal se le pone rebelde."
  ],
  [
   "¿Qué tal las vistas desde el mirador?",
   "Se ven las nubes pasar rozando las patas de la tortuga."
  ],
  [
   "Parece que refresca bastante al caer el sol.",
   "Mejor nos vamos pidiendo un tazón caliente en la cantina."
  ]
 ]
};
