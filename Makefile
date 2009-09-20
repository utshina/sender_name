NAME=sender_name
VERSION=0.3

FILE=$(NAME)-$(VERSION)-tb.xpi

$(FILE): 
	zip -r $(FILE) . -x $(FILE) Makefile .hg .backup
