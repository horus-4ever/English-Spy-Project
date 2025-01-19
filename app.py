#! env/bin/python

from flask          import Flask,    request, render_template, redirect, make_response
from flask_socketio import SocketIO, emit

from random import randint
import urllib


app = Flask(__name__)
socketio = SocketIO(app)




#--------------------------------------------------#
#                 Base de Données                  #
#--------------------------------------------------#

""" Schema BDD
                                     | pseudo
                                     | host
                                     | dice
                                     | result_dices
                                     | ready
             | players    | sid      | color
rooms | code |
             | status     | launched
             |
             | bet        | dice
             |            | number
             |
             | final
             |
             | nextPlayer
"""

rooms   = {}
clients = {}

#--------------------------------------------------#
#                     Script                       #
#--------------------------------------------------#
def resultat_des(nb_des):
    table_des = [0 for _ in range(nb_des)]
    for i in range(nb_des):
        table_des[i] = randint(1,6)
    return table_des

def count_des(code,dice):
    total_dice = 0
    if dice == 1:
        for sid in rooms[code]["players"]:
            for de in rooms[code]["players"][sid]["result_dices"]:
                if de == dice:
                    total_dice += 1
        return total_dice
    # Si différent de 1, on compte d'abord ceux dont le nb est le meme puis les 1 (par appel récursif)
    for sid in rooms[code]["players"]:
        for de in rooms[code]["players"][sid]["result_dices"]:
            if de == dice:
                total_dice += 1
    return total_dice + count_des(code,1)


def nextPlayer(code):
    list_players = list(rooms[code]["players"].keys())

    rooms[code]["nextPlayer"]+=1
    if rooms[code]["nextPlayer"] >= len(list_players):
        rooms[code]["nextPlayer"] = 0
    new_sid = list_players[rooms[code]["nextPlayer"]]

    while rooms[code]["players"][new_sid]["dice"] == 0:
        rooms[code]["nextPlayer"] += 1
        if rooms[code]["nextPlayer"] >= len(list_players):
            rooms[code]["nextPlayer"] = 0
        new_sid = list_players[rooms[code]["nextPlayer"]]

    return new_sid


def previousPlayer(code):
    list_players = list(rooms[code]["players"].keys())
    rooms[code]["nextPlayer"]-=1
    if rooms[code]["nextPlayer"] < 0:
        rooms[code]["nextPlayer"] = len(list_players)-1
    new_sid    = list_players[rooms[code]["nextPlayer"]]
    while rooms[code]["players"][new_sid]["dice"] == 0:
        rooms[code]["nextPlayer"] -= 1
        if rooms[code]["nextPlayer"] < 0:
            rooms[code]["nextPlayer"] = len(list_players)-1
        new_sid = list_players[rooms[code]["nextPlayer"]]
    return new_sid

#--------------------------------------------------#
#                     Routes                       #
#--------------------------------------------------#

@app.route('/', methods=['GET'])
def r_index():
    error = request.args.get("error")
    if error:
        return render_template(
            "index.html",
            error = error
        )
    return render_template(
        "index.html"
    )

@app.route('/join', methods=['POST'])
def r_join_game():
    if not request.form.get('pseudo'):
        url = urllib.parse.quote("Tu n'as pas le droit d'avoir un pseudo vide.")
        return redirect("/?error=" + url)

    pseudo = request.form.get('pseudo').strip() # delete space at start and end

    if pseudo == "":
        url = urllib.parse.quote("Tu n'as pas le droit d'avoir un pseudo avec que des espaces.")
        return redirect("/?error=" + url)

    if request.form.get('join') == 'true':
        code = str(request.form.get('code')).upper()

        if code not in rooms:
            url = urllib.parse.quote("Ce code n'existe pas. Vérifie que tu ne t'es pas trompé ou crée une partie.")
            return redirect("/?error=" + url)

        if rooms[code]["status"] == "launched":
            url  = urllib.parse.quote(" Tu ne peut pas rejoindre une partie déja en cours")
            return redirect("/?error=" + url)

        pseudos = [
            rooms[code]["players"][sid]["pseudo"]
            for sid in rooms[code]["players"]
        ]
        if pseudo.strip() in pseudos:
            url = urllib.parse.quote("Le pseudo est déjà pris.")
            return redirect(
                "/?error=" + url
            )

        resp = make_response(redirect("/room/" + code))
        resp.set_cookie("beludo.code",   code)
        resp.set_cookie("beludo.pseudo", pseudo)

        return resp


    if request.form.get('create') == 'true':
        lettres     = "0123456789ABCDEF"
        code_lenght = 1
        code        = ''
        for _ in range(code_lenght):
            no = randint(0,15)
            code += lettres[no]
        while code in rooms:
            code_lenght += 1
            code = ''
            for _ in range(code_lenght):
                no = randint(0,15)
                code += lettres[no]

        rooms[code]            = {}
        rooms[code]["status"]  = "waiting"
        rooms[code]["players"] = {}

        resp = make_response(redirect("/room/" + code))
        resp.set_cookie("beludo.code", code)
        resp.set_cookie("beludo.pseudo", pseudo)

        return resp

    return redirect('/')


@app.route('/room/<code>', methods=['GET'])
def r_rooms(code):
    if code not in rooms:
        url = urllib.parse.quote("Ce code n'existe pas. Vérifie que tu ne t'es pas trompé ou crée une partie.")
        return redirect("/?error=" + url)

    if rooms[code]["status"] == "launched":
        url  = urllib.parse.quote(" Tu ne peut pas rejoindre une partie déja en cours")
        return redirect("/?error=" + url)

    code_cookie   = request.cookies.get("beludo.code")
    pseudo_cookie = request.cookies.get("beludo.pseudo")

    if code_cookie != code:
        url  = urllib.parse.quote("Va y tu force les url. Connecte toi normalement")
        return redirect("/?error=" + url)

    if not pseudo_cookie:
        url  = urllib.parse.quote("tu n'a pas de pseudo, c'est facheux... connecte toi normalement")
        return redirect("/?error=" + url)

    pseudos = [
        rooms[code]["players"][sid]["pseudo"]
        for sid in rooms[code]["players"]
    ]
    if pseudo_cookie.strip() in pseudos:
        url = urllib.parse.quote("Le pseudo est déjà pris.")
        return redirect(
            "/?error=" + url
        )

    return render_template(
        "room.html",
        code    = code,
        players = rooms[code]["players"]
    )

def free_end(code):
    for sid in rooms[code]["players"]:
        del clients[sid]
    del rooms[code]

#--------------------------------------------------#
#                     Socket                       #
#--------------------------------------------------#

@socketio.on('disconnect')
def s_disconnect():
    try:
        code   = clients[request.sid]
    except:
        return

    host   = rooms[code]["players"][request.sid]["host"]
    list_players = list(rooms[code]["players"].keys())
    name_disconnect = rooms[code]["players"][request.sid]["pseudo"]
    try: # si c'est au tour du joueur qui se déconnecte de jouer, si jeu pas lancé, vaut False
        is_disconnected = (list_players[rooms[code]["nextPlayer"]] == request.sid)
    except:
        is_disconnected = False
    del clients[request.sid]
    del rooms[code]["players"][request.sid]
    # rooms[code]["players"][sid]["pseudo"]

    if len(rooms[code]["players"])==0: # Delete room if nobody
        free_end(code)
        return

    nb_players = 0

    for sid in rooms[code]["players"]:
        if rooms[code]["players"][sid]["dice"] != 0:
            nb_players += 1
    if (rooms[code]["status"] == "launched" and nb_players == 1): # si le joueur est seul encore à jouer dans la partie.
        wining_sid = None
        for sid in rooms[code]["players"]:
            if rooms[code]["players"][sid]["dice"] != 0:
                emit(
                    "info",
                    {
                        "info" : "vous avez gagné la partie par forfait des autres participants, bien joué a vous ! :)"
                    },
                    room = sid
                )
                wining_sid = sid
                break
        for sid in rooms[code]["players"]:

                emit(
                    "endGame",
                    {
                        "dices"          : dico_dices,
                        "playerWinning" : wining_sid
                    },
                    room = sid
                )
        free_end(code)
        return

    list_players = list(rooms[code]["players"].keys())

    if (host and is_disconnected): # host leave and it was it turn, need to change host
        newHostSID = list(rooms[code]["players"])[0]
        rooms[code]["players"][newHostSID]["host"] = True
        for sid in rooms[code]["players"]:
            if sid == newHostSID:
                emit(
                    "disconnect",
                    {
                        "sid"        : request.sid,
                        "newHost"    : newHostSID,
                        "youAreHost" : True,
                        "nextPlayer" : list_players[rooms[code]["nextPlayer"]]
                    },
                    room = sid
                )
                emit(
                    "info",
                    {
                        "info" : f"{name_disconnect} a quitté la partie."
                    },
                    room = sid
                )
                continue
            emit(
                "disconnect",
                {
                    "sid"     : request.sid,
                    "newHost" : newHostSID,
                    "nextPlayer" : list_players[rooms[code]["nextPlayer"]]
                },
                room = sid
            )
            emit(
                "info",
                {
                    "info" : f"{name_disconnect} a quitté la partie."
                },
                room = sid
            )
        return

    if is_disconnected :
        for sid in rooms[code]["players"]:
            emit(
                "disconnect",
                {
                    "sid"     : request.sid,
                    "nextPlayer" : list_players[rooms[code]["nextPlayer"]]
                },
                room = sid
            )
            emit(
                "info",
                {
                    "info" : f"{name_disconnect} a quitté la partie."
                },
                room = sid
            )
        return
    if host:
        newHostSID = list(rooms[code]["players"])[0]
        rooms[code]["players"][newHostSID]["host"] = True
        for sid in rooms[code]["players"]:
            if sid == newHostSID:
                emit(
                    "disconnect",
                    {
                        "sid"        : request.sid,
                        "newHost"    : newHostSID,
                        "youAreHost" : True
                    },
                    room = sid
                )
                emit(
                    "info",
                    {
                        "info" : f"{name_disconnect} a quitté la partie."
                    },
                    room = sid
                )
                continue
            emit(
                "disconnect",
                {
                    "sid"     : request.sid,
                    "newHost" : newHostSID
                },
                room = sid
            )
            emit(
                "info",
                {
                    "info" : f"{name_disconnect} a quitté la partie."
                },
                room = sid
            )
        return

    for sid in rooms[code]["players"]:
        emit(
            "disconnect",
            {
                "sid" : request.sid
            },
            room = sid
        )
        emit(
                "info",
                {
                    "info" : f"{name_disconnect} a quitté la partie."
                },
                room = sid
            )



@socketio.on("join")
def s_join(data):
    code   = data.get("code", None)
    pseudo = data.get("pseudo", None)

    if code not in rooms:
        emit(
            "error",
            {
                "error" : "Erreur : Cette partie n'existe pas."
            },
            room = request.sid
        )
        return

    if rooms[code]["status"] != "waiting":
        emit(
            "error",
            {
                "error" : "Erreur : La partie a déjà commencé."
            },
            room = request.sid
        )
        return

    pseudos = [
        rooms[code]["players"][sid]["pseudo"]
        for sid in rooms[code]["players"]
    ]
    if pseudo.strip() in pseudos:
        emit(
            "error",
            {
                "error" : "Erreur : Le pseudo est déjà pris"
            },
            room = request.sid
        )
        return
    colors_used = [rooms[code]["players"][sid]["color"] for sid in rooms[code]["players"]] # define with others players only
    list_colors = ["blue","green","orange","red","purple"]

    rooms[code]["players"][request.sid]           = {}
    rooms[code]["players"][request.sid]["pseudo"] = pseudo
    rooms[code]["players"][request.sid]["dice"]   = 5
    rooms[code]["players"][request.sid]["host"]   = len(rooms[code]["players"]) == 1
    rooms[code]["players"][request.sid]["ready"]  = True
    clients[request.sid] = code

    for color in list_colors:
        if color not in colors_used:
            rooms[code]["players"][request.sid]["color"] = color
            break

    for sid in rooms[code]["players"]:
        if (
            rooms[code]["players"][request.sid]["host"] and
            sid == request.sid
        ): # host
            emit(
                "join",
                {
                    "pseudo"     : pseudo,
                    "host"       : rooms[code]["players"][request.sid]["host"],
                    "youAreHost" : True,
                    "sid"        : request.sid,
                    "color"      : rooms[code]["players"][request.sid]["color"]
                },
                room = sid
            )
            continue
        emit(
            "join",
            {
                "pseudo" : pseudo,
                "host"   : rooms[code]["players"][request.sid]["host"],
                "sid"    : request.sid,
                "color"  : rooms[code]["players"][request.sid]["color"]
            },
            room = sid
        )


@socketio.on("launch")
def s_launch():
    code = clients[request.sid]
    if request.sid not in rooms[code]["players"]:
        emit(
            "error",
            {
                "error" : "Tu n'es pas dans cette partie."
            },
            room = request.sid
        )
        return


    if rooms[code]["players"][request.sid]["host"] is False:
        emit(
            "error",
            {
                "error" : "Tu n'est pas le gérant de la partie."
            },
            room = request.sid
        )
        return

    if len(rooms[code]["players"]) <= 0:
        emit(
            "error",
            {
                "error" : "vous ne pouvez pas encore lancer la partie, nombre de joueurs insuffisants. Il faut au minimum 3 joueurs pour démarer une partie"
            },
            room = request.sid
        )
        return

    rooms[code]["status"]        = "launched"
    rooms[code]["bet"]           = {}
    rooms[code]["bet"]["dice"]   = 0
    rooms[code]["bet"]["number"] = 0
    rooms[code]["nextPlayer"]    = 0 # defaut value, need to be reset at each round
    rooms[code]["final"]         = False
    next_sid = list(rooms[code]["players"].keys())[0]
    for sid in rooms[code]["players"]:
        nb_des = rooms[code]["players"][sid]["dice"]
        dices  = resultat_des(nb_des)
        rooms[code]["players"][sid]["result_dices"] = dices # stoque le resultat des dés
        emit(
            "launch",
            {
                "status" : "launched",
            },
            room = sid
            )
        emit(
            "roundStart",
            {
                "dices"      : dices,# la liste de ses dés
                "nextPlayer" : next_sid
            },
            room = sid
        )
    return

@socketio.on("ready")
def s_ready():

    code = clients[request.sid]
    rooms[code]["players"][request.sid]["ready"] = True
    rooms[code]["bet"]["dice"]                   = 0
    rooms[code]["bet"]["number"]                 = 0

    if rooms[code]["players"][request.sid]["dice"] == 0: # permet aux joueurs qui ont perdus d'être spectateurs
        return

    for sid in rooms[code]["players"]: # dit que le joueur request.sid est pret
        emit(
            "ready",
            {
                "sid" : request.sid
            },
            room = sid
        )

    for sid in rooms[code]["players"]: # si il y a encore des gens qui ne sont pas prets, arrete le programme
        if rooms[code]["players"][sid]["dice"] == 0:
            continue
        if (not rooms[code]["players"][sid]["ready"]):
            return

    for sid in rooms[code]["players"]:
        nb_des = rooms[code]["players"][sid]["dice"]
        dices  = resultat_des(nb_des)
        rooms[code]["players"][sid]["result_dices"] = dices # stoque le resultat des dés
        emit(
            "roundStart",# a envoyer a tt le monde
            {
                "dices"      : dices,
                "nextPlayer" : list(rooms[code]["players"].keys())[rooms[code]["nextPlayer"]]
            },
            room = sid
        )
        emit(
            "info",
            {
                "info" : " C'est reparti !"
            },
            room = sid
        )
    return


@socketio.on("play")
def s_play(data):
    code   = clients[request.sid]
    dice   = rooms[code]["bet"]["dice"]
    number = rooms[code]["bet"]["number"] # le nb de dés pariés si dice != 1; le double sinon

    if rooms[code]["players"][request.sid]["dice"] == 0: # permet aux joueurs qui ont perdus d'etre spectateurs
        return

    if request.sid != list(rooms[code]["players"].keys())[rooms[code]["nextPlayer"]]:
        emit(
            "error",
            {
                "error" : "vous ne pouvez pas jouer a la place d'un autre joueur."
            }
        )
        return

    if data.get("action") == "rise":
        new_dice   = data.get("dice")
        new_number = data.get("number")
        try: # met new_dice & new_number en format int
            new_dice   = int(new_dice)
            new_number = int(new_number)
        except:
            emit(
                "error",
                {
                    "error" : "la valeur entrée n'est pas un entier"
                }
            )
            return
        if new_dice not in [1,2,3,4,5,6]:
            emit(
                "error",
                {
                    "error" : "vous n'avez pas entré un numéro de dé valide."
                },
                room = request.sid
            )
            return

        if new_dice == 1: # le 1 vaut double
            new_number *= 2

        if number < new_number:
            rooms[code]["bet"]["dice"]   = new_dice
            rooms[code]["bet"]["number"] = new_number
            if new_dice == 1: # pour que ça soit bon au niveau de l'affichage
                new_number /= 2
            next_player = nextPlayer(code)
            for sid in rooms[code]["players"]:
                rooms[code]["players"][sid]["ready"] = False
                emit(
                    "play",
                    {
                        "action"     : "rise",
                        "dice"       : new_dice,
                        "number"     : new_number,
                        "nextPlayer" : next_player
                    },
                    room = sid
                )
        else:
            emit(
                "error",
                {
                    "error" : "tu ne peut pas parier a la hausse avec un dé plus faible."
                }
            )
    elif data.get("action") == "liar":
        if dice == 0:
            emit(
                "error",
                {
                    "error" : "vous êtes le premier joueur, vous devez forcément parier."
                }
            )
            return

        total_dice = count_des(code,dice)
        if dice == 1:
            number /= 2
        dico_dices = {}
        for sid in list(rooms[code]["players"].keys()): # stoque dans dico_dices l'ensemble des dés de la partie avec le nom de chacun des joueurs
            if rooms[code]["players"][sid]["dice"] != 0:
                dico_dices[sid] = rooms[code]["players"][sid]["result_dices"]
        if total_dice < number: # le joueur précédent mentait
            if rooms[code]["final"]:
                for sid in rooms[code]["players"]:
                    rooms[code]["players"][sid]["ready"] = False
                    emit(
                        "endGame",
                        {
                            "playerWinning" : request.sid,
                            "dices"          : dico_dices,
                        },
                        room = sid
                    )
                free_end(code)
                return

            prev_sid = previousPlayer(code)
            rooms[code]["players"][prev_sid]["dice"] -= 1 # retire un dé au joueur précédent
            next_player = nextPlayer(code)
            for sid in rooms[code]["players"]:
                rooms[code]["players"][sid]["ready"] = False
                emit(
                        "play",
                        {
                            "action"         : "liar",
                            "playerLoosing"  : prev_sid,
                            "dices"          : dico_dices,
                            "nextPlayer"     : next_player
                        },
                        room = sid
                    )

            if rooms[code]["players"][prev_sid]["dice"] == 0:
                nb_players = 0
                for sid in rooms[code]["players"]: # compte le nb de players encore en jeu
                    if rooms[code]["players"][sid]["dice"] != 0:
                        nb_players += 1
                if nb_players <= 2: # met le nb de dés pr la dernière manche à 5.
                    for sid in rooms[code]["players"]:
                        if rooms[code]["players"][sid]["dice"] != 0:
                            rooms[code]["players"][sid]["dice"] = 5
                            rooms[code]["final"]                = True

        else: # si le joueur actuel a perdu, l'autre ne mentait pas
            if rooms[code]["final"]:
                prev_player = previousPlayer(code)
                for sid in rooms[code]["players"]:
                    rooms[code]["players"][sid]["ready"] = False
                    emit(
                        "endGame",
                        {
                            "playerWinning" : prev_player
                        },
                        room = sid
                    )
                free_end(code)
                return
            rooms[code]["players"][request.sid]["dice"] -= 1
            next_player = nextPlayer(code)
            for sid in rooms[code]["players"]:
                rooms[code]["players"][sid]["ready"] = False
                emit(
                        "play",
                        {
                            "action"        : "liar",
                            "playerLoosing" : request.sid,
                            "dices"         : dico_dices,
                            "nextPlayer"    : next_player
                        },
                        room = sid
                    )
            if rooms[code]["players"][request.sid]["dice"] == 0:
                nb_players = 0
                for sid in rooms[code]["players"]:
                    if rooms[code]["players"][sid]["dice"] != 0:
                        nb_players += 1
                if nb_players <= 2: # devrait être égal à 2 sinon pas de finale
                    for sid in rooms[code]["players"]:
                        if rooms[code]["players"][sid]["dice"] != 0: # peut être superflu
                            rooms[code]["players"][sid]["dice"] = 5
                            rooms[code]["final"]                = True

    elif data.get("action") == "equal":
        if dice == 0:
            emit(
                "error",
                {
                    "error" : "vous êtes le premier joueur, vous devez forcément parier."
                }
            )
            return

        total_dice = count_des(code,dice)
        if dice == 1:
            number /= 2
        dico_dices = {}
        for sid in list(rooms[code]["players"].keys()): # stoque dans dico_dices l'ensemble des dés de la partie avec le nom de chacun des joueurs
            if rooms[code]["players"][sid]["dice"] != 0:
                dico_dices[sid] = rooms[code]["players"][sid]["result_dices"]
        if total_dice == number:
            if rooms[code]["final"]:
                for sid in rooms[code]["players"]:
                    emit(
                        "endGame",
                        {
                            "playerWinning" : request.sid,
                            "dices"          : dico_dices
                        },
                        room = sid
                    )
                free_end(code)
                return
            if rooms[code]["players"][request.sid]["dice"] < 5:
                rooms[code]["players"][request.sid]["dice"] += 1
            next_player = nextPlayer(code)
            for sid in rooms[code]["players"]:
                emit(
                        "play",
                        {
                            "action"        : "equal",
                            "playerWinning" : request.sid,
                            "dices"         : dico_dices,
                            "nextPlayer"    : next_player
                        },
                        room = sid
                    )

        else:
            if rooms[code]["final"]:
                prev_player = previousPlayer(code)
                for sid in rooms[code]["players"]:
                    emit(
                        "endGame",
                        {
                            "playerWinning" : prev_player,
                            "dices"          : dico_dices
                        },
                        room = sid
                    )
                free_end(code)
                return
            rooms[code]["players"][request.sid]["dice"] -= 1
            next_player = nextPlayer(code)
            for sid in rooms[code]["players"]:
                emit(
                        "play",
                        {
                            "action"     : "equal",
                            "dices"      : dico_dices,
                            "nextPlayer" : next_player
                        },
                        room = sid
                    )
            if rooms[code]["players"][request.sid]["dice"] == 0:
                nb_players = 0
                for sid in rooms[code]["players"]:
                    if rooms[code]["players"][sid]["dice"] != 0:
                        nb_players += 1
                if nb_players <= 2: # devrait être égal à 2 sinon pas de finale
                    for sid in rooms[code]["players"]:
                        if rooms[code]["players"][sid]["dice"] != 0: # peut être superflu
                            rooms[code]["players"][sid]["dice"] = 5
                            rooms[code]["final"]                = True


#--------------------------------------------------#
#                      Main                        #
#--------------------------------------------------#

if __name__ == "__main__":
    socketio.run(app,host='192.168.43.31', debug=True)
